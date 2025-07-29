const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();
const db = admin.firestore();

exports.flagContent = functions.https.onCall(async (data, context) => {
  const { content, listingId } = data;
  const blacklist = ["illegal", "scam", "fake", "free rent"];
  const flagged = blacklist.some(word => content.toLowerCase().includes(word));
  if (flagged) {
    await db.collection("listings").doc(listingId).update({ flagged: true });
  }
  return { flagged };
});

exports.sendEmail = functions.https.onCall(async (data, context) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: data.to,
    from: 'noreply@aubray.org',
    subject: data.subject,
    text: data.text,
  };
  await sgMail.send(msg);
  return { success: true };
});

exports.createStripeCheckout = functions.https.onCall(async (data, context) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{
      price: data.priceId,
      quantity: 1,
    }],
    success_url: data.successUrl,
    cancel_url: data.cancelUrl,
  });
  return { url: session.url };
});
