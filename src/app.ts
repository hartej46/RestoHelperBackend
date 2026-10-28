import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import useragent from "express-useragent";
import userRouter from "./routes/user.routes.ts";
import mediaRouter from "./routes/media.routes.ts";
import restaurantRouter from "./routes/restaurant.routes.ts";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(useragent.express());
app.use(
    express.json({
        limit: "16kb",
        verify: (req, _res, buffer) => {
            (req as typeof req & { rawBody?: Buffer }).rawBody = buffer;
        },
    })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use("/api/users", userRouter);
app.use("/api/media", mediaRouter);
app.use("/api/restaurants", restaurantRouter);
app.use("/api/restaurant", restaurantRouter);

export default app;
