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
}, {
  timestamps: true
});

const Event = mongoose.model("Event", eventSchema);
export default Event;
