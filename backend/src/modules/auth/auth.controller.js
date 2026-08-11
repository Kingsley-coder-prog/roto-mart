import { login, changePassword } from './auth.service.js';

export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body || {};
    res.json(await login(email, password));
  } catch (err) { next(err); }
}

export async function changePasswordController(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    await changePassword(currentPassword, newPassword);
    res.json({ ok: true });
  } catch (err) { next(err); }
}
