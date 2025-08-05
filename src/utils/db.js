import mongoose from "mongoose";
import "dotenv/config";

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("mongoose connected");
  })
  .catch((e) => {
    console.log(e);
  });

export default mongoose;
