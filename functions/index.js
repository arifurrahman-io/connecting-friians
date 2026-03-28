const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

/**
 * 1. NOTIFY EXPERTS: When a new post is created
 */
exports.onPostCreated = functions.firestore
  .document("posts/{postId}")
  .onCreate(async (snap, context) => {
    const post = snap.data();
    const category = post.primaryExpertiseName || post.category;

    if (!category) return null;

    const expertsSnap = await db
      .collection("users")
      .where("expertise", "array-contains", category)
      .get();

    const tokens = [];
    expertsSnap.forEach((doc) => {
      const user = doc.data();
      if (user.uid !== post.authorId && user.fcmTokens) {
        tokens.push(...user.fcmTokens);
      }
    });

    if (tokens.length === 0) return null;

    const message = {
      notification: {
        title: `New ${category} Problem`,
        body: `${post.authorName} is looking for help!`,
      },
      data: { postId: context.params.postId, type: "expert_alert" },
      tokens: tokens,
    };

    return admin.messaging().sendEachForMulticast(message);
  });

/**
 * 2. NOTIFY AUTHORS: When a comment or reply is posted
 */
exports.onCommentCreated = functions.firestore
  .document("comments/{commentId}")
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    let targetUid = null;
    let title = "";

    if (comment.parentId) {
      // It's a reply: Notify the person who wrote the original comment
      const parentComment = await db
        .collection("comments")
        .doc(comment.parentId)
        .get();
      targetUid = parentComment.data().authorId;
      title = "New reply to your comment";
    } else {
      // It's a main comment: Notify the post author
      const post = await db.collection("posts").doc(comment.postId).get();
      targetUid = post.data().authorId;
      title = "New comment on your post";
    }

    if (!targetUid || targetUid === comment.authorId) return null;

    const userDoc = await db.collection("users").doc(targetUid).get();
    const tokens = userDoc.data()?.fcmTokens;

    if (!tokens || tokens.length === 0) return null;

    return admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: {
        title: title,
        body: `${comment.authorName}: "${comment.body.substring(0, 50)}..."`,
      },
      data: { postId: comment.postId },
    });
  });
