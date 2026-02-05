import bcrypt from "bcryptjs";

async function hashPassword() {
  const password = "Admin123.";
  const saltRounds = 10;

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  console.log("Contraseña:", password);
  console.log("Hash bcrypt:", hashedPassword);
}

hashPassword().catch(console.error);
