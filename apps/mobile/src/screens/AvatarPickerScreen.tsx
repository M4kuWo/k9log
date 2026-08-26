import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDog, uploadDogPhoto } from '@k9log/shared';
import { supabase } from '../lib/supabase';
import { DogAvatar, presetAvatarUri } from '../components/DogAvatar';
import { PALETTE_ORDER, type PaletteColor } from '../constants/palette';

export function AvatarPickerScreen({
  dogId,
  householdId,
  dogName,
  currentPhotoUrl,
  fallbackColor,
  onDone,
}: {
  dogId: string;
  householdId: string;
  dogName: string;
  currentPhotoUrl: string | null;
  fallbackColor: PaletteColor;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState(currentPhotoUrl);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (photoUrl: string) =>
      createDog(supabase, { id: dogId, household_id: householdId, name: dogName, photo_url: photoUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogs', householdId] });
      onDone();
    },
    onError: (e) => setError((e as Error).message),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled) return null;
      const asset = result.assets[0];
      setPreviewUrl(asset.uri);
      const publicUrl = await uploadDogPhoto(
        supabase,
        dogId,
        asset.uri,
        asset.mimeType?.includes('png') ? 'image/png' : 'image/jpeg'
      );
      return publicUrl;
    },
    onSuccess: (publicUrl) => {
      if (publicUrl) saveMutation.mutate(publicUrl);
    },
    onError: (e) => setError((e as Error).message),
  });

  const isBusy = uploadMutation.isPending || saveMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <View className="flex-1 px-6 gap-6 py-6">
        <View className="items-center gap-3">
          <DogAvatar name={dogName} photoUrl={previewUrl} fallbackColor={fallbackColor} size={96} />
          {isBusy && <ActivityIndicator color="#E2706A" />}
        </View>

        <View className="gap-2">
          <Text className="text-stone-500 text-sm">Choose a color</Text>
          <View className="flex-row gap-3">
            {PALETTE_ORDER.map((color) => (
              <Pressable
                key={color}
                disabled={isBusy}
                onPress={() => {
                  setPreviewUrl(presetAvatarUri(color));
                  setError(null);
                  saveMutation.mutate(presetAvatarUri(color));
                }}
              >
                <DogAvatar name={dogName} photoUrl={presetAvatarUri(color)} fallbackColor={color} size={48} />
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          className="bg-[#E2706A] rounded-xl py-3 items-center"
          style={isBusy ? { opacity: 0.6 } : undefined}
          disabled={isBusy}
          onPress={() => uploadMutation.mutate()}
        >
          <Text className="text-white font-semibold text-base">Upload a photo</Text>
        </Pressable>

        {error && <Text className="text-red-600">{error}</Text>}
      </View>
    </SafeAreaView>
  );
}
