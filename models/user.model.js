import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  club: { type: String },
  registrations: [
    {
      eventId: { type: String, required: true },
      emailstatus: { type: Boolean, default: false },
      categories: [
        {
          label: { type: String },     // e.g., "Workshop"
          date: { type: Date },        // e.g., "2025-06-02"
          status: { type: Boolean, default: false }, // attended or not
        },
      ],
    },
  ],
});

const User = mongoose.model("User", userSchema);
export default User;
