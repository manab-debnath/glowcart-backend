import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
import path from "path";

dotenv.config({
    path: path.resolve("./.env"),
});

const PORT = process.env.PORT || 5000;

connectDB();

// global catches
/* app.use((err, req, res, next) => {
    res.status(500).json({
        msg: "An Internal server error occurred",
    });
}); */
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
