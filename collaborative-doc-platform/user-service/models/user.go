package models

type User struct {
    ID       int    `db:"id" json:"id"`
    Username string `db:"username" json:"username"`
    Password string `db:"password" json:"-"`
    Email    string `db:"email" json:"email"`
}
