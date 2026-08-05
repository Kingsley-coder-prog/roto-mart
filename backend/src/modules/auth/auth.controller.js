import { login } from './auth.service.js';

export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body || {};
    res.json(await login(email, password));
  } catch (err) { next(err); }
}
