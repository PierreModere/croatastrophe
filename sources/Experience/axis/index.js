import Axis from 'axis-api'

const gamepadEmulator = Axis.createGamepadEmulator(0) // 0 is gamepad index, often represents the first gamepad connected to your computer

function update() {
  gamepadEmulator.update()
  requestAnimationFrame(update)
}

update()

Axis.joystick1.setGamepadEmulatorJoystick(gamepadEmulator, 0) // 0 is the joystick index of the gamepad, often the one on the left side

Axis.registerGamepadEmulatorKeys(gamepadEmulator, 0, 'a', 1) // Gamepad button index 0 (PS4 X) to button "a" from group 1
Axis.registerGamepadEmulatorKeys(gamepadEmulator, 1, 'x', 1) // Gamepad button index 1 (PS4 Square) to button "x" from group 1
Axis.registerGamepadEmulatorKeys(gamepadEmulator, 2, 'i', 1) // Gamepad button index 2 (PS4 Circle) to button "i" from group 1
Axis.registerGamepadEmulatorKeys(gamepadEmulator, 3, 's', 1) // Gamepad button index 3 (PS4 Triangle) to button "s" from group 1

export default Axis

// export { gamepadEmulator }
