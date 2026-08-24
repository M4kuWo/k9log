import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
  const { dogId, kind } = route.params;
  const onSuccess = () => navigation.goBack();

  switch (kind) {
    case 'food':
      return <FoodLogForm dogId={dogId} onSuccess={onSuccess} />;
    case 'walk':
      return <WalkLogForm dogId={dogId} onSuccess={onSuccess} />;
    case 'treat':
      return <TreatLogForm dogId={dogId} onSuccess={onSuccess} />;
    case 'vomit':
      return <VomitLogForm dogId={dogId} onSuccess={onSuccess} />;
    case 'medication':
      return <MedicationLogForm dogId={dogId} onSuccess={onSuccess} />;
    case 'vaccine':
      return <VaccineLogForm dogId={dogId} onSuccess={onSuccess} />;
    case 'vet_appointment':
      return <VetAppointmentForm dogId={dogId} onSuccess={onSuccess} />;
  }
}
