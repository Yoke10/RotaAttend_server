import mongoose from "mongoose";
const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  categories: {
    type: [String],
  },
  attendance: {
    type: Number,
    default: 0,
  },
  admins: [
    {
      type: String,
      match: /.+\@.+\..+/,
    },
  ],
  from:{
    type:String,
    default:"RotractClub"
  },
  subject:{
    type:String,
    default:"Your Event QR Code"

  },
  html:{
    type:String,
    default:"<p>Hello ${name ||Participant}"

  },
  
}, {
  timestamps: true
});

const Event = mongoose.model("Event", eventSchema);
export default Event;
