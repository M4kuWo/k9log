import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  FoodLog,
  WalkLog,
  TreatLog,
  VomitLog,
  MedicationLog,
  VaccineLog,
  VetAppointment,
} from '@k9log/shared';
import type { MainStackParamList } from '../navigation/types';
import { FoodLogForm } from './logForms/FoodLogForm';
import { WalkLogForm } from './logForms/WalkLogForm';
import { TreatLogForm } from './logForms/TreatLogForm';
import { VomitLogForm } from './logForms/VomitLogForm';
import { MedicationLogForm } from './logForms/MedicationLogForm';
import { VaccineLogForm } from './logForms/VaccineLogForm';
import { VetAppointmentForm } from './logForms/VetAppointmentForm';

type Props = NativeStackScreenProps<MainStackParamList, 'AddLog'>;

export function AddLogScreen({ route, navigation }: Props) {
  const { dogId, kind, log } = route.params;
  const onSuccess = () => navigation.goBack();

  switch (kind) {
    case 'food':
      return <FoodLogForm dogId={dogId} log={log as FoodLog | undefined} onSuccess={onSuccess} />;
    case 'walk':
      return <WalkLogForm dogId={dogId} log={log as WalkLog | undefined} onSuccess={onSuccess} />;
    case 'treat':
      return (
        <TreatLogForm dogId={dogId} log={log as TreatLog | undefined} onSuccess={onSuccess} />
      );
    case 'vomit':
      return (
        <VomitLogForm dogId={dogId} log={log as VomitLog | undefined} onSuccess={onSuccess} />
      );
    case 'medication':
      return (
        <MedicationLogForm
          dogId={dogId}
          log={log as MedicationLog | undefined}
          onSuccess={onSuccess}
        />
      );
    case 'vaccine':
      return (
        <VaccineLogForm dogId={dogId} log={log as VaccineLog | undefined} onSuccess={onSuccess} />
      );
    case 'vet_appointment':
      return (
        <VetAppointmentForm
          dogId={dogId}
          log={log as VetAppointment | undefined}
          onSuccess={onSuccess}
        />
      );
  }
}
