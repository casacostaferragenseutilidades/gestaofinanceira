import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function registerUser() {
    const email = "casacostaferragenseutilidades@gmail.com";
    const username = "casacosta";
    const password = "admin123"; // Defina uma senha padrão ou use a env se preferir
    const fullName = "Casa Costa Ferragens e Utilidades";

    console.log(`Checking if user ${email} already exists...`);
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

    if (existingUser) {
        console.log(`User ${email} already exists.`);
        return;
    }

    console.log(`Registering user ${email}...`);
    const hashedPassword = await hashPassword(password);

    await db.insert(users).values({
        id: crypto.randomUUID(),
        username,
        email,
        password: hashedPassword,
        fullName,
        role: "admin",
        status: "active",
        active: true,
    });

    console.log(`User ${email} registered successfully!`);
    process.exit(0);
}

registerUser().catch((err) => {
    console.error("Error registering user:", err);
    process.exit(1);
});
