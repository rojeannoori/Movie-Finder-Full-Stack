"use strict"

global.__basedir = __dirname

// imports
const express = require('express')

// local imports
const util = require(__basedir + '/helpers/util')

// get cofig
const config = require(__basedir + '/config')
const {
  PORT: port,
} = config

// connect to the database
require(__basedir + '/helpers/mongoose')

// start express application
console.log(`starting application on port ${port}`)

// preparing express app
const app = express()

// Parse incoming json
app.use(express.json({ limit: '50mb' }))

//Parse incoming data from the form 
app.use(express.urlencoded({extended:true,limit:'50mb'}))

// CORS
const cors = require('cors')
app.use(cors())

//handlebars
const expressHandlebars = require('express-handlebars')
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')
const Movie = require(__basedir + '/models/movie')
const Comment = require(__basedir + '/models/comment')
const DEFAULT_MOVIES_PER_PAGE = 10

//multer
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({storage : storage})




//-----------------------------------------------------------------------------------------

//Home page -- getting a list of all movies paginated
app.get('/', async (req, res) => {
  
  
  var page = req.query.page
  if(page==null){page = 1}

  const count = await Movie.find().count().exec()
  const totalpages = Math.ceil(count / DEFAULT_MOVIES_PER_PAGE)
  
  const result = await Movie.find()
                            .lean()
                            .sort( {popularity : -1} )
                            .skip( (page -1 ) * DEFAULT_MOVIES_PER_PAGE )
                            .limit( DEFAULT_MOVIES_PER_PAGE )
                            .exec();

  if (Number(page)>1) {var previousPage = Number(page)-1}
  if (Number(page)<totalpages) {var nextPage = Number(page)+1}

  const finalResult = { data: result, pagination : {count: count , page : page, pagecount : totalpages, previousPage: previousPage, nextPage : nextPage} }
  
  var url = '/?'
  const context = {finalResult,url}
  res.render('home',context)
  
})



//Movie details page -- getting all the movie details
app.get('/movies/:id', async (req, res) => {

  const id = req.params.id
  const result = await Movie.find({_id : id }).lean().exec();
  const finalResult = { data: result,layout : null}

  res.render('movie', finalResult)
})


//Search page -- seraching for movies based on title, genre, production country. Results returned sorted and paginated
app.get('/search', async (req, res) => {

  
  var page = req.query.page
  if(page==null){page = 1}
  var title = req.query.title
  if(title==null){title=''}
  var genres = req.query.genres
  if(genres==null){genres=''}
  var production_countries = req.query.production_countries
  if(production_countries==null){production_countries=''}
  

  const count = await Movie.find({title : {$regex : title, $options: 'i'} , genres : {$regex: genres}, production_countries : {$regex : production_countries}}).count().exec()

  const totalpages = Math.ceil(count / DEFAULT_MOVIES_PER_PAGE)
  
  //Please not: the title is case sensitive! the result for avengers and Avengers are different
  const result = await Movie.find({ title : {$regex : title , $options: 'i'} , genres : {$regex: genres },  production_countries : {$regex : production_countries} })
                            .lean()
                            .sort({popularity : -1})
                            .skip( (page -1 ) * DEFAULT_MOVIES_PER_PAGE )
                            .limit( DEFAULT_MOVIES_PER_PAGE )
                            .exec();

 
  if (Number(page)>1) {var previousPage = Number(page)-1}
  if (Number(page)<totalpages) {var nextPage = Number(page)+1}
  const finalResult = { data: result , pagination : {count: count , page : page, pagecount : totalpages, previousPage: previousPage, nextPage : nextPage} }
  
  var url = '/search?title='+title+'&genres='+genres+'&production_countries='+production_countries+'&'
  const context = {finalResult, genres, title, production_countries, url}
  
  res.render('form', context)
})



// 404 Page
app.get('*', (req, res) => {
  res.status(404).send({
    "err": "not found!",
  })
})



app.listen(port, () => {
  console.log(`\nServer is up:\n\n\thttp://localhost:${port}\n\n`)
})

