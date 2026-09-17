import bcrypt from 'bcryptjs';

const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
};

const verifyPassword = async ( password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
};

export { 
    hashPassword,
    verifyPassword
}