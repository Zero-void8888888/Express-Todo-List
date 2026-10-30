
/*
Author: Jose Mondragon
Date:10/28/26
Description: Todo List with express
*/


import express from 'express'
import { engine } from 'express-handlebars'
import cookieParser from 'cookie-parser'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const app = express()
const port = 8080

// Set up database
const dbPromise = open({
    filename: './database/todolist.sqlite',
    driver: sqlite3.Database
})

const db = await dbPromise

// set up behaviors
app.use(express.static('static'))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// configuration
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')

//home page
app.get('/', (req, res) => {
    res.render('home', { layout: false })
})

app.get('/register', (req,res) =>{
    res.render('register',{ layout: false})
})

app.get('/tasks', async (req,res) => {
    const username = req.cookies.username;

    const user = await db.get(
        'SELECT user_id FROM users WHERE username = ?',
        [username]
    )

    if(!user){
        return res.redirect('/')
    }

    const tasks =  await db.all('SELECT * FROM tasks WHERE user_id = ?',
        [user.user_id]
    )

    res.render('tasks', {
        username: username,
        tasks: tasks

    })
})


//login
app.post('/', async (req, res) => {
    const username = req.body.username

    const result = await db.get(
        'SELECT * FROM users WHERE username = ?;',
        [username]
    )

    if (result) {
        res.cookie('username', result.username)
        res.redirect('/tasks')
    } else {
        res.redirect('/register')
    }
})

// creates account
app.post('/register', async (req, res) => {
    const username = req.body.username

    const result = await db.get(
        'SELECT * FROM users WHERE username = ?;',
        [username]
    )

    if (result) {
       res.redirect('/')
    } else {
        await db.run("INSERT INTO users(username) values(?)",[username])
        res.cookie('username', username)
        res.redirect('/tasks')
    }
})
// adds task
app.post("/add_task", async(req, res) =>{

    const description = req.body.description
    const username = req.cookies.username
    const result = await db.get(
        'SELECT * FROM users WHERE username = ?;',
        [username]
    )
    if(!result){
        return res.redirect('/')
    }

       await db.run("INSERT INTO tasks (user_id, task_desc) values(?,?)",[result.user_id,description])

        res.redirect('/tasks')
})



// Start server
app.listen(port, () => {
    console.log(`Server started on port: ${port}`)
})



