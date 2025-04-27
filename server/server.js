/* server/server.js
----------------------------------------------------------------- */
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors    = require('cors');
const path    = require('path');

const app = express();
const db  = new sqlite3.Database(path.resolve(__dirname, 'db.sqlite'));
db.exec('PRAGMA foreign_keys = ON');

app.use(cors());
app.use(express.json());

const publicPath = path.resolve(__dirname, '../public');
app.use(express.static(publicPath));
app.get('/', (_, res) => res.sendFile(path.join(publicPath, 'index.html')));

/* ----------  option lists (look-ups for <select>) ---------- */

app.get('/api/options/developers', (_, res) =>
  db.all(`SELECT DISTINCT Developer FROM projects
          WHERE Developer IS NOT NULL ORDER BY Developer`,
    [], (e,r)=> e ? res.status(500).json({error:e.message})
                  : res.json(r.map(x=>x.Developer)))
);

app.get('/api/options/areas', (_, res) =>
  db.all(`SELECT DISTINCT areaName FROM properties
          WHERE areaName IS NOT NULL ORDER BY areaName`,
    [], (e,r)=> e ? res.status(500).json({error:e.message})
                  : res.json(r.map(x=>x.areaName)))
);

app.get('/api/options/masterProjects', (_, res) =>
  db.all(`SELECT DISTINCT masterProjectName FROM projects
          WHERE masterProjectName IS NOT NULL ORDER BY masterProjectName`,
    [], (e,r)=> e ? res.status(500).json({error:e.message})
                  : res.json(r.map(x=>x.masterProjectName)))
);

app.get('/api/options/projects', (_, res) =>
  db.all(`SELECT DISTINCT projectName FROM projects
          WHERE projectName IS NOT NULL ORDER BY projectName`,
    [], (e,r)=> e ? res.status(500).json({error:e.message})
                  : res.json(r.map(x=>x.projectName)))
);

app.get('/api/options/management', (_, res) =>
  db.all(`SELECT DISTINCT managementCompanyName
            FROM management_companies
           WHERE managementCompanyName IS NOT NULL
        ORDER BY managementCompanyName`,
    [], (e,r)=> e ? res.status(500).json({error:e.message})
                  : res.json(r.map(x=>x.managementCompanyName)))
);

app.get('/api/options/floors', (_, res) =>
  db.all(`SELECT DISTINCT numberOfFloors
            FROM properties
           WHERE numberOfFloors IS NOT NULL
        ORDER BY numberOfFloors`, [],
    (e,r)=> e ? res.status(500).json({error:e.message})
              : res.json(r.map(x=>x.numberOfFloors)))
);

/* ----------  main search ---------- */

app.get('/api/projects', (req, res) => {
  const {
    developer,
    areaName,
    masterProjectName, 
    projectName,
    creationDate,
    minFloors,
    registeredOnly,
    managementCompanyName,
    limit
  } = req.query;

  let sql = `
    SELECT
      p.propertyID,
      p.areaName,
      pr.projectName,
      pr.masterProjectName,
      p.numberOfFloors,
      p.numberOfFlats,
      p.isRegistered,
      p.preRegistrationNumber,
      p.creationDate,
      pr.Developer            AS developer,
      m.managementCompanyName
    FROM properties AS p
    JOIN projects   AS pr ON p.projectID = pr.projectID
    LEFT JOIN management_companies AS m ON pr.projectID = m.projectID
    WHERE 1 = 1
  `;
  const params = [];

  if (developer)             { sql += ` AND pr.Developer = ?`;             params.push(developer); }
  if (areaName)              { sql += ` AND p.areaName = ?`;               params.push(areaName); }          /* 💡 */
  if (masterProjectName)     { sql += ` AND pr.masterProjectName = ?`;     params.push(masterProjectName); } /* 💡 */
  if (projectName)           { sql += ` AND pr.projectName = ?`;           params.push(projectName); }
  if (creationDate)          { sql += ` AND p.creationDate = ?`;           params.push(creationDate); }
  if (minFloors)             { sql += ` AND p.numberOfFloors >= ?`;        params.push(Number(minFloors)); }
  if (registeredOnly === 'true') sql += ` AND p.isRegistered = 1`;
  if (managementCompanyName) { sql += ` AND m.managementCompanyName = ?`;  params.push(managementCompanyName); }
  if (limit)                 { sql += ` LIMIT ?`;                          params.push(Number(limit)); }

  db.all(sql, params, (err, rows) =>
    err ? res.status(500).json({error: err.message}) : res.json(rows)
  );
});

/* ----------  raw-table helpers (unchanged) ---------- */

app.get('/api/properties', (_, res) =>
  db.all(`SELECT * FROM properties LIMIT 100`, [],
    (e,r)=> e ? res.status(500).json({error:e.message}) : res.json(r))
);

app.get('/api/management_companies', (_, res) =>
  db.all(`SELECT * FROM management_companies`, [],
    (e,r)=> e ? res.status(500).json({error:e.message}) : res.json(r))
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ▸ http://localhost:${PORT}`));
