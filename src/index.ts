import 'dotenv/config';
import app from './app.ts';
import { connectDB } from './db/db.ts';
import { createTableUser } from './repository/User.repository.ts';
import { createSessionTable } from './repository/Session.repository.ts';
import { createRestaurantTable } from './repository/Restaurant.repository.ts';

const PORT = process.env.PORT || 8000;


const initDB = async () => {
    await createTableUser();
    await createSessionTable();
    await createRestaurantTable();
    console.log('All database tables initialized successfully');
};

;(async () => {
    try {
        await connectDB();
        await initDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error : unknown ) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while creating server";
        console.error('Failed to start server:', errorMessage);
        process.exit(1);
    }
})();
