require('dotenv').config();

const mongoose = require('mongoose');
const Category = require('../models/Category.model');
const Settings = require('../models/Settings.model');
const Offer    = require('../models/Offer.model');
const Banner   = require('../models/Banner.model');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // ── Settings ──────────────────────────────────────────────────────────────
    await Settings.findOneAndUpdate(
      { key: 'global' },
      {
        key:                      'global',
        isOpen:                   true,
        closedMessage:            "We're currently closed. Please check back later.",
        deliveryFee:              15000,   // PKR 150
        minimumOrderAmount:       30000,   // PKR 300
        estimatedDeliveryMinutes: 35,
        restaurantPhone:          '+923001234567',
        restaurantEmail:          'info@peppers.pk',
      },
      { upsert: true, new: true }
    );
    console.log('✅ Settings seeded');

    // ── Launch Offer ──────────────────────────────────────────────────────────
    const offerExists = await Offer.findOne({ type: 'launch_discount' });
    if (!offerExists) {
      await Offer.create({
        type:          'launch_discount',
        name:          'Launch Offer — 10% off + Free Delivery',
        description:   'Exclusive launch offer for first 2 months',
        discountType:  'percentage',
        discountValue: 10,
        freeDelivery:  true,
        isActive:      true,
        appliesTo:     'all_orders',
      });
      console.log('✅ Launch offer created (10% off + free delivery)');
    } else {
      console.log('ℹ️  Launch offer already exists — skipped');
    }

    // ── Categories ────────────────────────────────────────────────────────────
    const categories = [
      { name: 'Burgers',  slug: 'burgers',  sortOrder: 1 },
      { name: 'Fries',    slug: 'fries',    sortOrder: 2 },
      { name: 'Drinks',   slug: 'drinks',   sortOrder: 3 },
      { name: 'Deals',    slug: 'deals',    sortOrder: 4 },
      { name: 'Sides',    slug: 'sides',    sortOrder: 5 },
      { name: 'Desserts', slug: 'desserts', sortOrder: 6 },
    ];

    let catCreated = 0;
    for (const cat of categories) {
      const exists = await Category.findOne({ slug: cat.slug });
      if (!exists) {
        await Category.create({
          ...cat,
          description: '',
          isVisible:   true,
          isDeleted:   false,
        });
        catCreated++;
      }
    }
    console.log(`✅ Categories seeded (${catCreated} new, ${categories.length - catCreated} existing)`);

    console.log('\n🌶️  Peppers database seeded successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run seed:admin   (create admin account)');
    console.log('  2. Add products via Admin Panel');
    console.log('  3. Upload category images via Admin Panel');
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
