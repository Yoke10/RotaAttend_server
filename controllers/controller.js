import Event from "../models/event.model.js";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import User from "../models/user.model.js";
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import jwt from "jsonwebtoken";
export const createEvent = async (req, res) => {
  try {
    const {
      name,
      starteventDate,endeventDate,
      categories,
    } = req.body;

    if (!name || !starteventDate ||!endeventDate || !categories ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const event = new Event({
      name,
      startDate:starteventDate,
      endDate:endeventDate,
      categories,
    });
    event.categories.push('Attendance');

    const savedEvent = await event.save();
    res.status(201).json({ message: "Event created", event: savedEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllEvents =async(req,res)=>{

    const events=await Event.find();
    res.status(200).json(events);
}

export const getEventById =async(req,res)=>{
    try {
        const {id}=req.query;
        const events=await Event.findById(id);
        if(!events)
        { 
        res.status(400).json('no event on this id');
        } 
    
        res.status(200).json(events);
    } catch (error) {
        res.status(400).json(error)
    }
   
}

export const removeAdmin=async(req,res)=>{
    try {
      const {admin,eventId}=req.body;
      const event=await Event.findByIdAndUpdate(eventId,{
        $pull:{admin}
      });
      res.status(200);
    } catch (error) {
      res.status(500);
    }
}
 const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com", // Replace with your SMTP host
      port: Number(process.env.SMTP_PORT) , // Common SMTP port
      secure: true, // Set to `true` if using a secure connection (e.g., 465 for SSL)
      auth: {
        user:process.env.SMTP_USER , // Replace with your email
        pass: process.env.SMTP_PASS  // Replace with your password
      },
    });
  
    const wrapText = (text, maxCharsPerLine) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

    export const createOrUpdateUser = async (userData, templatePath, x, y, width, height, nameLayout, clubLayout) => {
      try {
        const { email, name, club, eventId } = userData;
        console.log(name);
    
        if (!email || !eventId) {
          throw new Error("Missing email or eventId");
        }
    // Ensure nameLayout and clubLayout are defined and have necessary properties
    if (!nameLayout || !nameLayout.width || !nameLayout.height) {
      throw new Error("Invalid nameLayout object");
    }
    if (!clubLayout || !clubLayout.width || !clubLayout.height||!clubLayout.fontWeight) {
      throw new Error("Invalid clubLayout object");}
        const qrData = `${email}_${eventId}`;
        const qrCode = await QRCode.toDataURL(qrData); // base64 QR
    
        let user = await User.findOne({ email });
        if (user) {
          const alreadyRegistered = user.registrations.some((r) => r.eventId === eventId);
          if (!alreadyRegistered) {
            user.registrations.push({ eventId });
            await user.save();
          }
        } else {
          user = new User({ email, name, club, registrations: [{ eventId }] });
          await user.save();
        }
    
        // Prepare QR code buffer
        const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
    
        // Resize the QR Code buffer
        const resizedQRBuffer = await sharp(qrBuffer)
          .resize(width, height)
          .toBuffer();
    
        // Generate SVG text buffer for Name
       const maxNameCharsPerLine = 20; // adjust if needed
const nameLines = wrapText(name, maxNameCharsPerLine);

const svgNameText = `
  <svg width="${nameLayout.width}" height="${nameLayout.height}" xmlns="http://www.w3.org/2000/svg">
    ${nameLines.map((line, i) => `
      <text 
        x="50%" 
        y="${40 + i * nameLayout.fontSize * 1.2}" 
        font-size="${nameLayout.fontSize}px" 
        font-weight="${nameLayout.fontWeight}" 
        fill="${nameLayout.color}" 
        font-family="${nameLayout.fontFamily}" 
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${line}
      </text>
    `).join('')}
  </svg>
`;
const nameBuffer = Buffer.from(svgNameText);

    
        // Generate SVG text buffer for Club (similar to name)
        const maxClubCharsPerLine = 20; // adjust as needed
const clubLines = wrapText(club, maxClubCharsPerLine);

const svgClubText = `
  <svg width="${clubLayout.width}" height="${clubLayout.height}" xmlns="http://www.w3.org/2000/svg">
    ${clubLines.map((line, i) => `
      <text 
        x="50%" 
        y="${40 + i * clubLayout.fontSize * 1.2}" 
        font-size="${clubLayout.fontSize}px" 
        font-weight="${clubLayout.fontWeight}" 
        fill="${clubLayout.color}" 
        font-family="${clubLayout.fontFamily}" 
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${line}
      </text>
    `).join('')}
  </svg>
`;
const clubLayoutBuffer = Buffer.from(svgClubText);

    
        // Composite QR code and text (name and club) on template with adjusted position and size
        const finalImageBuffer = await sharp(templatePath)
          .composite([
            { input: resizedQRBuffer, top: y, left: x },
            { input: nameBuffer, top: nameLayout.y, left: nameLayout.x },
            { input: clubLayoutBuffer, top: clubLayout.y, left: clubLayout.x }
          ])
          .toBuffer();
      const event =await Event.findById(eventId);
        // Send email with embedded image
        await transporter.sendMail({
          from: event.from,
          to: email,
          subject:event.subject ,
          html: event.html,
          attachments: [
            {
              filename: 'pass.png',
              content: finalImageBuffer,
              cid: 'qrcodeimg',
            },
          ],
        });

        await User.updateOne(
  { email, "registrations.eventId": eventId },
  { $set: { "registrations.$.emailstatus": true } }
);
    
        return { email, status: "success" };
      } catch (err) {
        throw new Error(`Failed for ${userData.email}: ${err.message}`);
      }
    };
    
export const bulkRegisterUsers = async (req, res) => {
      const { users, x, y, width, height, template,nameLayout,clubLayout } = req.body;
      const results = [];
      console.log(users);
      console.log(x);
      console.log(y);
  
      console.log(width);
  
      console.log(height);
     console.log(nameLayout);
     console.log(clubLayout);

    
      // Save the template once before the loop starts
      const templateBuffer = Buffer.from(template.split(',')[1], 'base64');
      const templatePath = path.join(process.cwd(), 'template.png');
      await fs.writeFile(templatePath, templateBuffer); // saves file once
    
      // Process each user
      for (const userData of users) {
        try {
          const result = await createOrUpdateUser(userData, templatePath, x, y, width, height,nameLayout,clubLayout);
          results.push(result);
        } catch (err) {
          results.push({ email: userData.email, status: "error", error: err.message });
          return res.status(202).json({"eror":err.message})
        }
      }
    
      res.status(200).json({ message: "Processed users", results });
    };

export const generateMagicLink = async (req, res) => {
      try {
        const { data, eventId } = req.body;
    
        const SECRET = process.env.JWT_SECRET;
        const CLIENT_URL = process.env.Client_Url || "http://localhost:3000";
    
        for (const entry of data) {
          const { email, hours } = entry;
    
          // Generate token
          const token = jwt.sign({ email, eventId }, SECRET, { expiresIn: `${hours}h` });
    
          // Add admin to DB
          await Event.findByIdAndUpdate(eventId, {
            $push: { admins: email },
          });
    
          // Create link
          const link = `${CLIENT_URL}/RotractEvent/${eventId}?token=${token}`;
          
    
          // Send email
          const mailOptions = {
            from: `"Rotract Club`,
            to: email,
            subject: "Your Event Access Link",
            html: `<p>Hello,</p>
                   <p>You have been invited to access the event. Click the link below to proceed:</p>
                   <a href="${link}">${link}</a>
                   <p>This link will expire in ${hours} hour(s).</p>`,
          };
    
          await transporter.sendMail(mailOptions);
        }
    
        res.status(200).json({ message: "Magic links sent successfully" });
      } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Failed to generate or send links", error: err.message });
      }
    };
export const verifyMagicLink=async(req, res) => {
  const { token } = req.body;
  // console.log(token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, eventId } = decoded;

    const event=await Event.findById(eventId);
    if (!event) return res.status(403).json({ error: "Unauthorized Event" });

    if(!event.admins.includes(email)){
      return res.status(403).json({ error: "Unauthorized Email" });
    }

    res.status(200).json({ email, eventId,catagories:event.categories });
  } catch (err) {
    return res.status(401).json({ error: "Token invalid or expired" });
  }
}
export const updateUserEvent = async (req, res) => {
  try {
    const { email, eventId, Category, today } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const registration = user.registrations.find(
      (reg) => reg.eventId === eventId
    );

    if (!registration) {
      return res.status(400).json({ message: "User not registered for this event" });
    }

    // Normalize today's date
    const todayDate = new Date(today).toISOString().split("T")[0];

    // Check if any existing category has same label AND already completed for today
    const alreadyMarked = registration.categories.some((cat) => {
      const catDate = new Date(cat.date).toISOString().split("T")[0];
      return cat.label === Category && cat.status === true && catDate === todayDate;
    });

    if (alreadyMarked) {
      return res.status(201).json({ message: "Category already marked as completed for today" });
    }

    // Else, add new record
    registration.categories.push({ label: Category, date: today, status: true });

    await user.save();

    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating user category:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
//excel she controler
export const getUsersByEventId = async (req, res) => {
  try {
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    const users = await User.find({
      registrations: { $elemMatch: { eventId } },
    });

    const result = users.map(user => {
      const reg = user.registrations.find(r => r.eventId === eventId);
      return {
        email: user.email,
        name: user.name,
        club: user.club,
        emailstatus:reg.emailstatus,
        categories: reg.categories || [],
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
export const removeAdminEvent = async (req, res) => {
  const { email, id } = req.body;

  try {
    const result = await Event.updateOne(
      { _id: id },
      { $pull: { admins: email } }
    );


  

    const updatedEvent = await Event.findById(id);

    res.status(200).json({ message: "Admin removed", event: updatedEvent });
  } catch (error) {
    console.error("Error removing admin:", error);
    res.status(500).json({ error: "Server error" });
  }
};
export const updateEmailContent = async (req, res) => {
  const {from,subject,htmlContent,eventId} = req.body;

  try {
     const event =await Event.findByIdAndUpdate(eventId,{
      from:from,
      subject:subject,
      html:htmlContent
     })
     res.status(200).json(event);
  } catch (error) {
    console.error("Error removing admin:", error);
    res.status(500).json({ error: "Server error" });
  }
};