import { InputAction } from "../../engine";
import { GenericSensor, Sensor } from "../../types/events";
import {
  ChannelReference,
  InteractionChannel,
  SelectionInteraction,
} from "../../types/interaction";

export interface SelectionSensorOptions<T = unknown> {
  name?: ChannelReference<SelectionInteraction<T>>;
}

export function SelectionSensor(options?: { name?: string }): GenericSensor;
export function SelectionSensor<T>(
  options: SelectionSensorOptions<T>,
): Sensor<T>;
export function SelectionSensor<T>(
  options: SelectionSensorOptions<T> = {},
): Sensor<T> {
  const { name = InteractionChannel.SELECTION } = options;
  return (
    { signal, primaryCandidate },
    { getInteraction, upsertInteraction },
  ) => {
    if (
      signal.action !== InputAction.START ||
      primaryCandidate?.data === undefined
    ) {
      return;
    }
    const selectedDatum = primaryCandidate.data;
    const current =
      typeof name === "string" ? getInteraction(name) : getInteraction(name);
    const currentSelection =
      current && "selection" in current ? current.selection : [];
    const nextSelection = currentSelection.includes(selectedDatum)
      ? currentSelection.filter((datum) => datum !== selectedDatum)
      : [...currentSelection, selectedDatum];
    const interaction: SelectionInteraction<T> = {
      selection: nextSelection,
      mode: "discrete",
    };
    if (typeof name === "string") {
      upsertInteraction(name, interaction);
    } else {
      upsertInteraction(name, interaction);
    }
  };
}
