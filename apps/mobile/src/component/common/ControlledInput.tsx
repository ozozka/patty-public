import React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { TaggedInputProps } from './TaggedInput';
import { TaggedInput } from './TaggedInput';

export interface ControlledInputProps<
  TFieldValues extends FieldValues,
> extends Omit<TaggedInputProps, 'values' | 'onChangeText'> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: object;
}

/**
 * A wrapper for TaggedInput to be used with react-hook-form.
 */
export function ControlledInput<TFieldValues extends FieldValues>({
  name,
  control,
  rules,
  ...props
}: ControlledInputProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <TaggedInput
          {...props}
          values={value}
          onChangeText={onChange}
          error={error ? (error.message ?? 'Required') : undefined}
        />
      )}
    />
  );
}
