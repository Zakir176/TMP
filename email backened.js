// server.js - Main backend file for Matrix Players email system
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB (you'll need to set up your MongoDB connection string in .env)
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Subscriber Schema
const subscriberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    interests: [String],
    isActive: { type: Boolean, default: true },
    confirmationToken: String,
    confirmedAt: Date,
    subscriptionDate: { type: Date, default: Date.now }
});

// Email Campaign Schema
const campaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    targetAudience: { type: String, default: 'all' },
    sentAt: { type: Date, default: Date.now },
    sentCount: { type: Number, default: 0 },
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 }
});

// Create models
const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);

// Configure email transporter (using nodemailer)
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail', 'SendGrid', etc.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Helper function to generate confirmation token
function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper function to send welcome email
async function sendWelcomeEmail(subscriber) {
    const confirmationToken = generateToken();
    
    // Update subscriber with confirmation token
    await Subscriber.findByIdAndUpdate(subscriber._id, {
        confirmationToken: confirmationToken
    });
    
    // Create email content
    const confirmationLink = `${process.env.WEBSITE_URL}/confirm-subscription?token=${confirmationToken}&email=${subscriber.email}`;
    
    const mailOptions = {
        from: `"Matrix Players" <${process.env.EMAIL_USER}>`,
        to: subscriber.email,
        subject: 'Welcome to Matrix Players - Confirm Your Subscription',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="background-color: #1E1E1E; padding: 20px; text-align: center; color: #F5F5F5;">
                    <h1 style="margin: 0;">Welcome to Matrix Players</h1>
                </div>
                <div style="padding: 20px; background-color: #F5F5F5;">
                    <p>Hello ${subscriber.name},</p>
                    <p>Thank you for subscribing to Matrix Players! We're excited to have you join our community of traders.</p>
                    <p>To complete your subscription and start receiving our trading insights, please confirm your email address by clicking the button below:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${confirmationLink}" style="background-color: #00C853; color: #121212; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirm Subscription</a>
                    </p>
                    <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; font-size: 12px;">${confirmationLink}</p>
                    <p>If you did not sign up for Matrix Players, you can safely ignore this email.</p>
                    <p>Best regards,<br>The Matrix Players Team</p>
                </div>
                <div style="background-color: #121212; color: #F5F5F5; padding: 15px; text-align: center; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} Matrix Players. All rights reserved.</p>
                    <p>
                        <a href="${process.env.WEBSITE_URL}/unsubscribe?email=${subscriber.email}" style="color: #00C853; text-decoration: none;">Unsubscribe</a> | 
                        <a href="${process.env.WEBSITE_URL}/privacy-policy" style="color: #00C853; text-decoration: none;">Privacy Policy</a>
                    </p>
                </div>
            </div>
        `
    };
    
    // Send email
    return transporter.sendMail(mailOptions);
}

// Helper function to send campaign emails
async function sendCampaignEmails(campaign, subscribers) {
    let sentCount = 0;
    
    for (const subscriber of subscribers) {
        // Personalize the content for each subscriber
        let personalizedContent = campaign.content
            .replace(/{{name}}/g, subscriber.name)
            .replace(/{{email}}/g, subscriber.email)
            .replace(/{{experienceLevel}}/g, subscriber.experienceLevel);
        
        // Add tracking pixel for open tracking
        const trackingPixel = `<img src="${process.env.WEBSITE_URL}/track-open/${campaign._id}/${subscriber._id}" width="1" height="1" />`;
        personalizedContent += trackingPixel;
        
        // Create email content with unsubscribe link
        const mailOptions = {
            from: `"Matrix Players" <${process.env.EMAIL_USER}>`,
            to: subscriber.email,
            subject: campaign.subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <div style="background-color: #1E1E1E; padding: 20px; text-align: center; color: #F5F5F5;">
                        <h1 style="margin: 0;">Matrix Players</h1>
                    </div>
                    <div style="padding: 20px; background-color: #F5F5F5;">
                        ${personalizedContent}
                    </div>
                    <div style="background-color: #121212; color: #F5F5F5; padding: 15px; text-align: center; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} Matrix Players. All rights reserved.</p>
                        <p>
                            <a href="${process.env.WEBSITE_URL}/unsubscribe?email=${subscriber.email}" style="color: #00C853; text-decoration: none;">Unsubscribe</a> | 
                            <a href="${process.env.WEBSITE_URL}/privacy-policy" style="color: #00C853; text-decoration: none;">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            `
        };
        
        try {
            // Send email
            await transporter.sendMail(mailOptions);
            sentCount++;
        } catch (error) {
            console.error(`Failed to send email to ${subscriber.email}:`, error);
        }
    }
    
    return sentCount;
}

// API Routes

// 1. Subscribe new user
app.post('/api/subscribe', async (req, res) => {
    try {
        const { name, email, experienceLevel, interests } = req.body;
        
        // Check if subscriber already exists
        const existingSubscriber = await Subscriber.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).json({ 
                success: false, 
                message: 'This email is already subscribed' 
            });
        }
        
        // Create new subscriber
        const newSubscriber = new Subscriber({
            name,
            email,
            experienceLevel,
            interests
        });
        
        // Save subscriber to database
        await newSubscriber.save();
        
        // Send welcome email
        try {
            await sendWelcomeEmail(newSubscriber);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // We continue even if email fails - the user is still subscribed
        }
        
        return res.status(201).json({
            success: true,
            message: 'Subscription successful! Please check your email to confirm.',
            subscriber: {
                id: newSubscriber._id,
                name: newSubscriber.name,
                email: newSubscriber.email,
                subscriptionDate: newSubscriber.subscriptionDate
            }
        });
    } catch (error) {
        console.error('Subscription error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// 2. Confirm subscription
app.get('/api/confirm-subscription', async (req, res) => {
    try {
        const { token, email } = req.query;
        
        // Find subscriber
        const subscriber = await Subscriber.findOne({ 
            email,
            confirmationToken: token
        });
        
        if (!subscriber) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired confirmation link' 
            });
        }
        
        // Update subscriber
        subscriber.confirmedAt = new Date();
        subscriber.isActive = true;
        subscriber.confirmationToken = null;
        await subscriber.save();
        
        // Redirect to confirmation page
        return res.redirect(`${process.env.WEBSITE_URL}/subscription-confirmed`);
    } catch (error) {
        console.error('Confirmation error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// 3. Unsubscribe
app.get('/api/unsubscribe', async (req, res) => {
    try {
        const { email } = req.query;
        
        // Find and update subscriber
        const subscriber = await Subscriber.findOneAndUpdate(
            { email },
            { isActive: false },
            { new: true }
        );
        
        if (!subscriber) {
            return res.status(404).json({ 
                success: false, 
                message: 'Subscriber not found' 
            });
        }
        
        // Redirect to unsubscribe confirmation page
        return res.redirect(`${process.env.WEBSITE_URL}/unsubscribed`);
    } catch (error) {
        console.error('Unsubscribe error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// 4. Create and send email campaign
app.post('/api/campaigns', async (req, res) => {
    try {
        const { name, subject, content, targetAudience } = req.body;
        
        // Create new campaign
        const newCampaign = new Campaign({
            name,
            subject,
            content,
            targetAudience
        });
        
        // Save campaign to database
        await newCampaign.save();
        
        // Find subscribers based on target audience
        let subscriberQuery = { isActive: true, confirmedAt: { $ne: null } };
        
        if (targetAudience !== 'all') {
            subscriberQuery.experienceLevel = targetAudience;
        }
        
        const subscribers = await Subscriber.find(subscriberQuery);
        
        // Send emails
        const sentCount = await sendCampaignEmails(newCampaign, subscribers);
        
        // Update campaign with sent count
        newCampaign.sentCount = sentCount;
        await newCampaign.save();
        
        return res.status(200).json({
            success: true,
            message: `Campaign sent to ${sentCount} subscribers`,
            campaign: {
                id: newCampaign._id,
                name: newCampaign.name,
                sentCount
            }
        });
    } catch (error) {
        console.error('Campaign error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// 5. Track email opens
app.get('/track-open/:campaignId/:subscriberId', async (req, res) => {
    try {
        const { campaignId, subscriberId } = req.params;
        
        // Update campaign open count
        await Campaign.findByIdAndUpdate(campaignId, {
            $inc: { openCount: 1 }
        });
        
        // Send a 1x1 transparent pixel
        res.set('Content-Type', 'image/gif');
        res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    } catch (error) {
        console.error('Tracking error:', error);
        res.status(500).end();
    }
});

// 6. Get all subscribers (admin only)
app.get('/api/subscribers', async (req, res) => {
    try {
        // In production, add authentication middleware to protect this route
        const subscribers = await Subscriber.find().sort({ subscriptionDate: -1 });
        
        return res.status(200).json({
            success: true,
            count: subscribers.length,
            subscribers: subscribers.map(sub => ({
                id: sub._id,
                name: sub.name,
                email: sub.email,
                experienceLevel: sub.experienceLevel,
                interests: sub.interests,
                isActive: sub.isActive,
                subscriptionDate: sub.subscriptionDate,
                confirmedAt: sub.confirmedAt