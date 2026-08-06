# Hardware Notes

## Prototype Components

- ESP32 development board.
- MAX6675 thermocouple interface module.
- K-Type thermocouple.
- Regulated DC supply for prototype testing.
- PCB draft for embedded node layout reference.

## Sensor Interface

MAX6675 to ESP32:

```text
MAX6675 VCC -> 3.3V
MAX6675 GND -> GND
MAX6675 SCK -> GPIO18
MAX6675 SO  -> GPIO19
MAX6675 CS  -> GPIO5
```

## Field Direction

Future field deployments can evaluate MAX31855 and STM32/LoRaWAN for improved robustness and communication range. The current repository keeps the working prototype firmware and dashboard as the implementation baseline.

## PCB Assets

PCB draft files are stored in:

```text
hardware/pcb/
```
