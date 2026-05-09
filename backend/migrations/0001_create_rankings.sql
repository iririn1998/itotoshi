CREATE TABLE rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL CHECK (length(display_name) > 0),
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at INTEGER NOT NULL
);

CREATE INDEX rankings_order_idx ON rankings (
  score DESC,
  created_at ASC,
  id ASC
);
