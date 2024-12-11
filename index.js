const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_ice_cream_shop_db"
);

const app = express();
app.use(express.json());
app.use(require("morgan")("dev"));
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
        SELECT * from flavors ORDER BY created_at DESC;
        

        `;

    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/flavors/:id", async (req, res, next) => {
  console.log("id:  ", req.params.id);
  try {
    const SQL = `
          select * from flavors where id=$1;
        `;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
app.post("/api/flavors", async (req, res, next) => {
    console.log('name: ', req.params.name);
  try {
    const SQL = `
        insert into flavors (name) 
        values ($1)
        returning *
        `;

    const response = await client.query(SQL, [req.body.name]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
        update flavors 
        set name= $1, is_favorite = $2, updated_at = now()
        where id = $3 returning *
        `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
        delete from flavors where id = $1

        `;

    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  await client.connect();
  console.log("connected to database");

  let SQL = `
        drop table if exists flavors;
        create table flavors(
        id serial primary key,
        name varchar(50) not null,
        is_favorite boolean default false not null,
        created_at timestamp default now(),
        updated_at timestamp default now()
        ); 
    `;

  await client.query(SQL);
  console.log("tables created");
  SQL = `
    insert into flavors(name, is_favorite) values('vanilla', false);
    insert into flavors(name, is_favorite) values('butter pecan', false);
    insert into flavors(name, is_favorite) values('chocolate', false);
    insert into flavors(name, is_favorite) values('pistachio', true);
    `;

  await client.query(SQL);
  console.log("data seeded");

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();