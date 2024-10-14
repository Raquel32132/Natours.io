const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { deleteOne, updateOne, createOne, getOne, getAll } = require('./handlerFactory');

const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1 - Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2 - Create checkout session
  const product = await stripe.products.create({
    name: `${tour.name} Tour`,
    description: tour.summary,
    images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
  });
 
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: tour.price * 100,
    currency: 'usd',
  });
 
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
  });

  // 3 - Create session as response
  res.status(200).json({
    status: 'success',
    session
  })
});

const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email }))._id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error ${err.message}`);
  }
 
  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);
 
  res.status(200).json({ received: true });
};

exports.createBooking = createOne(Booking);

exports.getBooking = getOne(Booking);

exports.getAllBookings = getAll(Booking);

exports.updateBooking = updateOne(Booking);

exports.deleteBooking = deleteOne(Booking);