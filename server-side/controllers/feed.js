const { validationResult } = require("express-validator");
const Post = require("../models/post");
const User = require("../models/user");
const { deleteFile } = require("../util/file");

const errorHandler = (error) => {
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  return error;
};

const errorCode = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const postError = (post) => {
  if (!post) {
    const message = "Couldnot find post.";
    const statusCode = 422;
    errorCode(message, statusCode);
  }
};

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then((posts) => {
      res.status(200).json({
        message: "Fetced Posts",
        posts: posts,
        totalItems: totalItems,
      });
    })
    .catch((error) => {
      next(errorHandler(error));
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = "validation failed, entered data is incorrect.";
    const statusCode = 422;
    errorCode(message, statusCode);
  }

  if (!req.file) {
    const message = "There is no image";
    const statusCode = 422;
    errorCode(message, statusCode);
  }
  // Create post in db
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace("images\\", "images/");
  let creator;
  //هنتأكد ان لو باقي بيانات الفورمة مش كاملة نحذف الصورة اللي اترفعت
  if (!title || !content) {
    // //ميثود انا عاملها لحذف الملفات اما نعطيها مسار الملف
    // deleteFile(imageUrl);
    // //وهنا نخلي قيمة المتغير اللي محفوظ فيه مسار الصورة غير معرف عشان ميتحفظش في الداتا بيز
    // imageUrl = undefined;
    //اضافة اخرى لايقاف باقي الكود
    return;
  }
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });
  post
    .save()
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "Post Created",
        post: post,
        creator: { _id: creator._id, name: creator.name },
      });
    })
    .catch((error) => {
      next(errorHandler(error));
    });
  //status(201) ==> success created resource
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  console.log(postId);
  Post.findById(postId)
    .then((post) => {
      postError(post);
      res.status(200).json({ message: "Post Fetched", post: post });
    })
    .catch((error) => {
      console.log(error);
      next(errorHandler(error));
    });
};

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = "validation failed, entered data is incorrect.";
    const statusCode = 422;
    errorCode(message, statusCode);
  }

  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  console.log(imageUrl);

  if (req.file) {
    imageUrl = req.file.path.replace("images\\", "images/");
  }

  if (!imageUrl) {
    errorCode("No file picked", 422);
  }

  Post.findById(postId)
    .then((post) => {
      postError(post);

      if (post.creator.toString() !== req.userId) {
        errorCode("Could not Find post", 403);
      }

      if (imageUrl !== post.imageUrl) {
        deleteFile(post.imageUrl);
      }

      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then((result) => {
      res.status(200).json({ message: "post updated", post: result });
    })
    .catch((error) => {
      next(errorHandler(error));
    });
};

exports.deletPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      postError(post);

      if (post.creator.toString() !== req.userId) {
        errorCode("Could not Find post", 403);
      }
      //Check logged in user
      deleteFile(post.imageUrl);
      return Post.deleteOne({ _id: postId });
    })
    .then(() => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(postId);
      user.save();
    })
    .then((result) => {
      console.log(result);
      res.status(200).json({ message: "Deleted well" });
    })
    .catch((error) => {
      next(errorHandler(error));
    });
};
