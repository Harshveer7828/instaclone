var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const storyModel = require("./story");
const localStrategy = require("passport-local");
const passport = require("passport");
const upload = require("./multer");
const utils = require("../utils/utils");

const commentModel = require("./comment");
passport.use(new localStrategy(userModel.authenticate()));

router.get("/", function (req, res) {
  res.render("index", { footer: false });
});

router.get("/login", function (req, res) {
  res.render("login", { footer: false });
});
const uniqueStories = [];
const uniqueStoryId = {};
// feed page 
router.get("/feed", async function (req, res) {
  const loggedUser = await userModel
    .findOne({
      username: req.session.passport.user,
    })
    .populate("stories");
  const post = await postModel.find().populate("user");

  const story = await storyModel
    .find({ user: { $ne: loggedUser } })
    .populate("user");
  story.forEach((item) => {
    if (!uniqueStoryId[item._id]) {
      uniqueStoryId[item._id] = true;
      uniqueStories.push(item);
    }
  });
  console.log(uniqueStories);
  res.render("feed", {
    footer: true,
    post,
    loggedUser,
    user: loggedUser,
    utils,
    stories: uniqueStories,
  });
});
router.get("/profile", isLoggedIn, async function (req, res) {
  let loggedUser = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("profile", { footer: true, loggedUser });
});

router.get("/search", async function (req, res) {
  let loggedUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  res.render("search", { footer: true, loggedUser });
});

router.get("/edit", async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("edit", { footer: true, user, loggedUser: user });
});

router.get("/upload", isLoggedIn, async function (req, res) {
  let loggedUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  res.render("upload", { footer: true, loggedUser });
});

//  handles the information from the from

router.post(
  "/postupload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    if (req.body.category === "post") {
      const post = await postModel.create({
        user: user._id,
        picture: req.file.filename,
        caption: req.body.caption,
      });
      user.posts.push(post._id);
    } else if (req.body.category === "story") {
      const story = await storyModel.create({
        user: user._id,
        picture: req.file.filename,
      });
      user.stories.push(story._id);
    } else {
      console.log("bhai kch glt keh diya hehehe!");
      res.render("profile");
    }
    await user.save();
    res.redirect("/feed");
  }
);

router.post("/update", isLoggedIn, async function (req, res) {
  const user = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    { username: req.body.username, name: req.body.name, bio: req.body.bio },
    { new: true }
  );

  req.login(user, function (err) {
    if (err) throw err;
    res.redirect("/profile");
  });
});

router.post(
  "/upload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    user.profileImage = req.file.filename;
    await user.save();
    res.redirect("/edit");
  }
);

// like route
router.get("/like/:postid", isLoggedIn, async function (req, res) {
  // finding the post id from the database getting from the url :postid
  const post = await postModel.findOne({ _id: req.params.postid });
  // finding the loggedIn user
  const user = await userModel.findOne({ username: req.session.passport.user });
  // loggedIn user like the post check if it is present in likes array or not. -1 means the user id is not present in likes array
  if (post.likes.indexOf(user._id) === -1) {
    post.likes.push(user._id);
  } else {
    post.likes.splice(post.likes.indexOf(user._id), 1);
  }
  // update the database
  await post.save();
  // sending the res
  res.json(post);
});

// search route
router.get("/search/:user", isLoggedIn, async function (req, res) {
  const searchTerm = `^${req.params.user}`;
  const regex = new RegExp(searchTerm);
  const user = await userModel.find({ username: { $regex: regex } });
  res.json(user);
});

// router for userprofile lookin by loggedIn user.

router.get("/profile/:user", isLoggedIn, async function (req, res) {
  const user = await userModel
    .findOne({ username: req.params.user })
    .populate("posts");
  const loggedUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  if (loggedUser.username === req.params.user) {
    res.redirect("/profile");
  } else {
    res.render("userprofile", { user, loggedUser, footer: true });
  }
});

// follow route

router.get("/follow/:userid", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ _id: req.params.userid });
  const loggedUser = await userModel.findOne({
    username: req.session.passport.user,
  });

  if (user.followers.indexOf(loggedUser._id) === -1) {
    loggedUser.following.push(user._id);
    user.followers.push(loggedUser._id);
  } else {
    let index = loggedUser.following.indexOf(user._id);
    let index2 = user.followers.indexOf(loggedUser._id);
    loggedUser.following.splice(index, 1);
    user.followers.splice(index2, 1);
  }
  await user.save();
  await loggedUser.save();

  res.redirect("back");
});

//Route which handle the post save by the logged in user

router.get("/save/:postid", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ username: req.session.passport.user });
  console.log("hello hiii biilooo byeeee");
  // Check if the post is not present in the saved array then push else splice its id
  if (user.savedPost.indexOf(req.params.postid) === -1) {
    user.savedPost.push(req.params.postid);
  } else {
    let index = user.savedPost.indexOf(req.params.postid);
    user.savedPost.splice(index, 1);
  }
  // saved the changes in the database
  await user.save();
  res.json(user);
});

// story view
router.get("/story/:storyid", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ username: req.session.passport.user });
  const userStory = await storyModel
    .findOne({ _id: req.params.storyid })
    .populate("user");
  res.json(userStory);
});

// comments route to handle comments

router.post("/comment/:postId", isLoggedIn, async function (req, res) {
  const user=await userModel.findOne({username:req.session.passport.user});
  const post= await postModel.findOne({_id:req.params.postId});
  const comment=await commentModel.create({
    user:user._id,
    text:req.body.comment,
    post:req.params.postId
  })
  post.comments.push(comment);
  await post.save();
  res.redirect
  ("back")
});

// viewAll comments of a post


router.get("/opencomments/:postid",isLoggedIn,async function (req,res){
  const user=await userModel.findOne({username:req.session.passport.user})
  const posts = await postModel.findOne({_id: req.params.postid}).populate("comments").populate("user");
  const comments = await commentModel.find({post:req.params.postid}).populate("user");
  res.render("commentSection",{posts,utils,user,footer:true,loggedUser:user,comments});
  console.log(user)
  console.log(posts)
});

// register route
router.post("/register", function (req, res) {
  var userdata = new userModel({
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
  });
  userModel.register(userdata, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

// code for log in
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/",
  }),
  function (req, res) {}
);

// code for isLoggedIn Middleware

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

// code for logout
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get('/message',isLoggedIn,async (req,res)=>{
  const loggedUser = await userModel.findOne({username: req.session.passport.user}).populate('following')
  res.render('message.ejs',{footer: true,loggedUser})
})

router.get('/message/:username',isLoggedIn,async (req,res)=>{
  const loggedUser = await userModel.findOne({username: req.session.passport.user});

  const oppositeUser = await userModel.findOne({username : req.params.username});
  console.log(oppositeUser,req.params.username);
  res.render('messagePage.ejs',{footer:false,loggedUser,oppositeUser});
})





module.exports = router;
