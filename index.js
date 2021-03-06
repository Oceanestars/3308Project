const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require("body-parser");
const mysql = require('mysql');
const path = require('path');
const pug = require('pug');


var createError = require('http-errors');
var logger = require('morgan');
var session = require('express-session');

const app = express();



const port = 80;


const db = mysql.createConnection({
    host:"localhost",
    user: "root",
    password: "",
    multipleStatements:true
});

//need for coach signup
var Big=2;

var Match_Id=4;


var sql ="DROP DATABASE IF EXISTS League; CREATE DATABASE League;" //Make New Database, drop existing League DB if exists

sql+="SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';" //make it so you can enter stuff

sql+="CREATE SCHEMA IF NOT EXISTS `League` DEFAULT CHARACTER SET utf8; USE League;" //make schema step into leage db

sql += "CREATE TABLE IF NOT EXISTS `League`.`Team` (`Team_Id` INT NOT NULL AUTO_INCREMENT,`TeamName` VARCHAR(45) NULL,`Active` TINYINT NULL DEFAULT 1,`TeamDesc` VARCHAR(200) NULL,PRIMARY KEY (`Team_Id`))ENGINE = InnoDB;" //make team table

sql+="CREATE TABLE IF NOT EXISTS `League`.`UserGroup` (`UserGroup_Id` INT NOT NULL AUTO_INCREMENT,`UserGroupName` VARCHAR(50) NULL,PRIMARY KEY (`UserGroup_Id`))ENGINE = InnoDB;" //make usergroup table

sql+="CREATE TABLE IF NOT EXISTS `League`.`User` (`User_Id` INT NOT NULL AUTO_INCREMENT,`username` VARCHAR(50) NOT NULL,`password` VARCHAR(50) NOT NULL,`Team_Id` INT NOT NULL,`UserGroup_Id` INT NULL,INDEX `TeamId_idx` (`Team_Id` ASC),UNIQUE INDEX `username_UNIQUE` (`username` ASC),PRIMARY KEY (`User_Id`),INDEX `User_Group_Id_idx` (`UserGroup_Id` ASC),CONSTRAINT `TeamId`FOREIGN KEY (`Team_Id`)REFERENCES `League`.`Team` (`Team_Id`)ON DELETE NO ACTION ON UPDATE NO ACTION,CONSTRAINT `User_Group_Id`FOREIGN KEY (`UserGroup_Id`)REFERENCES `League`.`UserGroup` (`UserGroup_Id`)ON DELETE NO ACTION ON UPDATE NO ACTION)ENGINE = InnoDB;" //make user table

sql+="CREATE TABLE IF NOT EXISTS `League`.`Profile` (`User_Id` INT NOT NULL AUTO_INCREMENT,`email` VARCHAR(100) NULL,`phone` VARCHAR(10) NULL,`ProfilePicLink` VARCHAR(100) NULL, name VARCHAR(100) NULL,PRIMARY KEY (`User_Id`),CONSTRAINT `User_Id`FOREIGN KEY (`User_Id`)REFERENCES `League`.`User` (`User_Id`)ON DELETE NO ACTION ON UPDATE NO ACTION)ENGINE = InnoDB;" //make profile table

sql+="CREATE TABLE IF NOT EXISTS `League`.`Matches` (`Match_Id` INT NOT NULL AUTO_INCREMENT,`GDate` DATE NULL,`Arena` VARCHAR(100) NULL,`GTime` TIME NULL,PRIMARY KEY (`Match_Id`))ENGINE = InnoDB;" //make matches table

sql+="CREATE TABLE IF NOT EXISTS `League`.`TeamMatch_Bridge` (`Match_Id` INT NOT NULL,`Team_Id` INT NOT NULL,`Score` INT NULL,`is_Winner` TINYINT NULL DEFAULT 0,PRIMARY KEY (`Match_Id`, `Team_Id`),INDEX `Team_Id_idx` (`Team_Id` ASC),CONSTRAINT `Match_Id`FOREIGN KEY (`Match_Id`)REFERENCES `League`.`Match` (`Match_Id`)ON DELETE NO ACTION ON UPDATE NO ACTION,CONSTRAINT `Team_Id`FOREIGN KEY (`Team_Id`)REFERENCES `League`.`Team` (`Team_Id`)ON DELETE NO ACTION ON UPDATE NO ACTION)ENGINE = InnoDB;" //Make Table TeamMatch_Bridge

sql+="CREATE TABLE IF NOT EXISTS `League`.`Setup` (`Limiter` ENUM('only') NOT NULL DEFAULT 'only',`NumOfTeams` INT NOT NULL,`TeamSize` INT NOT NULL,`LeagueName` VARCHAR(100) NOT NULL,PRIMARY KEY (`Limiter`),UNIQUE INDEX `Limiter_UNIQUE` (`Limiter` ASC))ENGINE = InnoDB;" //make Setup Table

sql+="CREATE TABLE IF NOT EXISTS `League`.`Rules` (`Rule_Id` INT NOT NULL AUTO_INCREMENT,`Rule_Description` VARCHAR(200) NULL,PRIMARY KEY (`Rule_Id`))ENGINE = InnoDB;" //make rules table

sql+="CREATE TABLE IF NOT EXISTS `League`.`GroupRules_Bridge` (`UserGroup_Id` INT NOT NULL,`Rule_Id` INT NOT NULL,PRIMARY KEY (`UserGroup_Id`, `Rule_Id`),INDEX `Rule_Id_idx` (`Rule_Id` ASC),CONSTRAINT `UserGroup_Id`FOREIGN KEY (`UserGroup_Id`)REFERENCES `League`.`UserGroup` (`UserGroup_Id`)ON DELETE NO ACTION ON UPDATE NO ACTION,CONSTRAINT `Rule_Id`FOREIGN KEY (`Rule_Id`)REFERENCES `League`.`Rules` (`Rule_Id`)ON DELETE NO ACTION ON UPDATE NO ACTION)ENGINE = InnoDB;" //make GroupRules_bridge table


//sql+="SET SQL_MODE=@OLD_SQL_MODE;SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;" //set various variables back to default


// Sql test code

sql+="insert into User(username,password,Team_Id,UserGroup_Id) Values('Mario','pass',1, 2);"
sql+="INSERT INTO Profile(email,phone,ProfilePicLink,name) Values('Mario@gmail.com','1234567891','../img/portrait/Mario.jpg','Mario Mario');"

sql+="insert into User(username,password,Team_Id,UserGroup_Id) Values('Peach','pass',1, 2);"
sql+="INSERT INTO Profile(email,phone,ProfilePicLink,name) Values('Princess@gmail.com','1237577891','../img/portrait/Peach.jpg','Princess Peach');"

sql+="insert into User(username,password,Team_Id,UserGroup_Id) Values('Luigi','pass',1, 2);"
sql+="INSERT INTO Profile(email,phone,ProfilePicLink,name) Values('Luigi@gmail.com','1234555591','../img/portrait/Luigi.jpg','Luigi Mario');"

sql+="insert into User(username,password,Team_Id,UserGroup_Id) Values('Yoshi','pass',1, 2);"
sql+="INSERT INTO Profile(email,phone,ProfilePicLink,name) Values('Yoshi@gmail.com','1234567891','../img/portrait/Yoshi.jpg','T. Yoshisaur');"

sql+="insert into User(username,password,Team_Id,UserGroup_Id) Values('Bowser','pass',1, 1);"
sql+="INSERT INTO Profile(email,phone,ProfilePicLink,name) Values('CoachBowser@gmail.com','5555555555','../img/portrait/Bowser.jpg','King Koopa');"

sql+="insert into User(username,password,Team_Id,UserGroup_Id) Values('Somebody','password',2, 1);"
sql+="INSERT INTO Profile(email,phone,ProfilePicLink,name) Values('Test@gmail.com','5555555555','../img/portrait/Somebody.jpg','Fred Nobody');"

sql+="INSERT INTO Team Values(1,'Mario Party',1, 'I am Coach Bowser. These Are my Minions');"
sql+="INSERT INTO Team Values(2,'Another Test Team',1, 'This is another Test Team');"


//insert example matches
sql+="Insert Into Matches(GDate, GTime, Arena) Values('2022-12-20','03:45:00','Pluto');"
sql+="SET FOREIGN_KEY_CHECKS=0;";
sql+="INSERT INTO TeamMatch_Bridge(Match_id, Team_id) Values(1,1);";

sql+="Insert Into Matches(GDate, GTime, Arena) Values('2019-12-20','05:30:00','Mars');"
sql+="SET FOREIGN_KEY_CHECKS=0;";
sql+="INSERT INTO TeamMatch_Bridge(Match_id, Team_id) Values(2,1);";


sql+="Insert Into Matches(GDate, GTime, Arena) Values('2020-01-20','19:20:00','Neptune');"
sql+="SET FOREIGN_KEY_CHECKS=0;";
sql+="INSERT INTO TeamMatch_Bridge(Match_id, Team_id) Values(3,2);";




db.connect(function(err){      //con is the reference to our database
    if(err) throw err;
    console.log("Connected!");
    db.query(sql, function(err,result){
        if (err) throw err;
        console.log("Database League Created");
    });
});

global.db=db;


//configure middleware
app.set('port',process.env.port || port); //set express to use this port
app.set('views', __dirname + '/views'); //set express to look in this folder to render views
app.set('view engine', 'pug'); //configure template engine
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); //parse form data client
app.use(express.static(__dirname + '/'));
app.use(fileUpload()); //configure file upload
app.use(session({
    secret: 'eioptuwlkgmhi',
    resave: true,
    saveUninitialized: false

}));

var pass_req=true;
var user_req=true;
var got_in=true;






app.get('/',function(req,res){
    res.redirect('/login');
});


// login page
app.get('/login', function(req, res) {
    req.session.name=undefined;
	res.render('pages/login',{
		css:"../css/login.css",
        my_title:"Login Page",
        pass_req: pass_req,
        user_req: user_req,
        got_in: got_in
    });
    got_in=true;
    pass_req=true;
    user_req=true;
});




app.get('/submit_success',function(req,res){
    res.render('pages/submit_success.pug', {
        css:"../css/submit_success.css"
    });
});

app.post('/auth', function(req, res) {
	var username = req.body.username;
    var password = req.body.password;
    console.log(req.session.name);
	if (username && password) {
		db.query('select username, password from User where username =?',[username], function(error, rows, fields){
            console.log(rows);
            console.log(rows[0].password);
			if (rows[0].password==password){
                req.session.loggedin = true; //if username and password are correct the you get redirected to Player page
				req.session.name = username;
				res.redirect('/home');
			} else {
                got_in=false;
                res.redirect('/login')
			}
			res.end();
		});
	} else {
        got_in=false;
        if(password=="")
        {
            pass_req=false;
            got_in=true;
        }
        if(username=="")
        {
            user_req=false;
            got_in=true;
        }
		res.redirect('/login');
		res.end();
	}
});

app.get('/login/auth', function(req, res)
{
    res.render('pages/login');
});


// login page
app.get('/home', function(req, res) {
    if(req.session.name===undefined)
    {
        res.redirect('/login')
    }
    var query1="Select * from User where username='";
    query1+=req.session.name;
    query1+="';";

    var query2="select * from Profile where User_Id IN(Select User_Id from User where username='";
    query2+=req.session.name;
    query2+="' );";

    var query3="select * from Team where Team_Id IN(Select Team_Id from User where username='";
    query3+=req.session.name;
    query3+="' );";
    db.query(query1+query2+query3,function(error, rows, fields)
    {
        console.log(rows[0]);
        res.render('pages/PlayerPage',{
            css:'../css/PlayerPage.css',
            title:"Home page",
            data1: rows[0],
            data2: rows[1],
            data3: rows[2]
        });
    });
});


// registration page
app.get('/register', function(req, res) {
    var query1="Select TeamName,Team_Id from Team where Team_Id>0;";
    query2="Select Max(Team_id)+1 as big from Team;";
    db.query(query1+query2, function(err,rows,fields){
        if(!err)
        {
            console.log(rows);
            console.log('Here');
            console.log(req.body.big);
            res.render('pages/register',
            {
                local_css:"my_style.css",
                title:"Registration Page",
                css:"../css/register.css",
                Data:rows[0],
                Max:rows[1]
            })
        }
        else
            console.log('Encountered Error')
	});
});

app.post('/sign_up_p', function(req,res){
    var name = req.body.player_fullName;
    var username2 = req.body.player_userName;
    var email =req.body.player_emailAddress;
    var pass = req.body.player_passwordFirst;
    var pass2 = req.body.player_passwordConfirm;
    var phone =req.body.player_phoneNumber;
    var teamid =req.body.team;
    console.log(teamid)
    var pic="../img/defaultplayer.png";
var query1="INSERT INTO User (username,password,Team_Id,UserGroup_Id) VALUES ('" + username2 + "','" + pass + "','" + teamid + "',2)";
var query2 = "INSERT INTO Profile (email,phone,name,ProfilePicLink) VALUES ('" + email + "', '" + phone + "','" + name + "','" + pic +"')";
db.query(query1,function(error, results){
        if (error) throw error;
        console.log("Record inserted Successfully");

    });
db.query(query2,function(error, results){
        if (error) throw error;
        console.log("Profile inserted Successfully");

    });

    res.redirect('/submit_success');
});

app.post('/sign_up_c', function(req,res){
    Big++;
    var name = req.body.coach_fullName;
    var username2 = req.body.coach_userName;
    var email =req.body.coach_emailAddress;
    var pass = req.body.coach_passwordFirst;
    var pass2 = req.body.coach_passwordConfirm;
    var phone =req.body.coach_phoneNumber;
    var teamname = req.body.coach_createTeam;
    var teamid = Big;
    var pic="../img/defaultplayer.png";

var query0 = "INSERT INTO Team (TeamName,Active,TeamDesc) VALUES ('" + teamname + "', 1,'Meet our new team')";
var query3 = "SELECT * FROM Team WHERE TeamName = ?";
var query1="INSERT INTO User (username,password,Team_Id,UserGroup_Id) VALUES ('" + username2 + "','" + pass + "','" + teamid + "',1)";
var query2 = "INSERT INTO Profile (email,phone,name, ProfilePicLink) VALUES ('" + email + "', '" + phone + "','" + name + "','" + pic +"')";


db.query(query0,function(error, results){
        if (error) throw error;
        console.log("Team Created Successfully");

    });

db.query(query3,[teamname], function(error, rows, fields){
        if (error) throw error;
        teamid = rows[0].Team_Id;
        var teamn = rows[0].TeamName;
        console.log(teamn);
    });
db.query(query1,function(error, results){
        if (error) throw error;
        console.log("Record inserted Successfully");

    });
db.query(query2,function(error, results){
        if (error) throw error;
        console.log("Profile inserted Successfully");

    });

    res.redirect('/submit_success');
});

app.get('/team',function(req,res){
    if(req.session.name===undefined)
    {
        res.redirect('/login')
    }
    var user = req.session.name;
    var query1="Select * from User Where Team_Id=(Select Team_Id from User where username IN('";
    query1+=req.session.name;
    query1+="'));";


    var query2="Select * from Team where Team_Id=(Select Team_Id from User where username IN('";
    query2+=req.session.name;
    query2+="'));";

    var query3="Select p.name, u.UserGroup_Id, p.ProfilePicLink from User u inner join Profile p on u.User_Id=p.User_Id inner join Team t on t.Team_Id=u.Team_Id Where u.Team_Id=(Select Team_Id from User where username IN('";
    query3+=req.session.name;
    query3+="'));";
    db.query(query1+query2+query3, function(err, rows, fields) {
    if(!err)
    {
        res.render('pages/team.pug',{
            css:'../css/teampage.css',
            data1:rows[0],
            data2:rows[1],
            data3:rows[2],
            title:'Team Page'
        });
    }
    else
        console.log('encountered error');
    });
});


//Update Changed picture in database
app.post('/newpic', function(req,res){
    newpic=req.body.changepic
    var pic="../img/";
    pic+=newpic;

var query1="update Profile set ProfilePicLink ='"
query1+=pic;
query1+="' where User_Id=(Select User_Id from User where username IN ('";
query1+=req.session.name;
query1+="'));"
db.query(query1,function(error, results){
        if (error) throw error;
        console.log("Picture Updated Successfully");

    });
});


// Match finder
app.get('/matchfinder', function(req, res) {
    if(req.session.name===undefined)
    {
        res.redirect('/login')
    }
    var query1="select * from Matches m inner join TeamMatch_Bridge tmb on tmb.Match_Id=m.Match_id inner join Team t on t.Team_Id=tmb.Team_Id Where tmb.Team_Id NOT IN (Select Team_id from User where username IN('";
    query1+=req.session.name;
    query1+="'));";

    var query2="select * from Matches m inner join TeamMatch_Bridge tmb on tmb.Match_Id=m.Match_id inner join Team t on t.Team_Id=tmb.Team_Id Where tmb.Team_Id IN (Select Team_id from User where username IN('";
    query2+=req.session.name
    query2+="'));";

    query3="Select UserGroup_Id from User where username in('";
    query3+=req.session.name;
    query3+= "');"//is the user a coach?

    query4="Select p.name, p.email, u.Team_Id from Profile p inner join User u on u.User_Id=p.User_id Where UserGroup_Id=1;";

    query6="Select Team_id"

    db.query(query1+query2+query3+query4, function(err, rows, fields) {
        if(!err)
        {
            console.log('Not In')
            console.log(rows[0]);
            console.log('In');
            console.log(rows[1]);
            res.render('pages/matchfinder.pug',{
                css:'../css/teampage.css',
                data1:rows[0],
                data2:rows[1],
                data3:rows[2],
                data4:rows[3],
                title:'Match Page'
            });
        }
        else
            console.log('encountered error');
        });
    });

//Add Match to Board
app.post('/post_game', function(req,res){
    var arena=req.body.location;
    var d = req.body.date
    var t = req.body.time

    var query1="Insert Into Matches(GDate, GTime, Arena) Values('";
    query1+=d;
    query1+="','"+t+"'";
    query1+=",'"+arena+"');";
    var query2="SET FOREIGN_KEY_CHECKS=0;";
    var query3="INSERT INTO TeamMatch_Bridge(Match_Id, Team_Id) Values(" + Match_Id + "," + 0 + ");";

    var query4="Update TeamMatch_Bridge SET Team_Id=(Select Team_Id from User Where username = '";
    query4+=req.session.name;
    query4+="')";
    query4+="Where Team_Id = 0;"

    console.log(query1);


    db.query(query1,function(error, results){
        if (error) throw error;
        console.log("Post Being Added");

    });

    db.query(query2,function(error, results){
        if (error) throw error;
        console.log("Foreign Key Checks Lifted");
    });

    db.query(query3,function(error, results){
        if (error) throw error;
        console.log("Post Entered");
    });

    db.query(query4,function(error, results){
        if (error) throw error;
        console.log("Post Successful");
    });
    Match_Id++;


    res.redirect('/matchfinder')
});


app.listen(port, ()=> {
    console.log('Server running on port:',port);
});
