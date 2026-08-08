import React from 'react';
import { Input } from './ui/input';
import { 
    FormControl,
    FormItem,
    FormLabel,
    FormMessage
} from './ui/form';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface FormFieldProps <T extends FieldValues> {
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "file";
  control: Control<T>
}

const FormField = <T extends FieldValues>({ 
    control, 
    name,
    label,
    placeholder,
    type = "text"
} : FormFieldProps<T>) => {
    return (
        <Controller 
            name={name} 
            control={control} 
            render={({ field }) => (
                <FormItem>
                  <FormLabel className="label">{label}</FormLabel>
                  <FormControl>
                    <Input placeholder={placeholder} 
                           type={type} 
                           {...field}  
                           className="input placeholder:text-gray-500"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>        
            )}
        />
    )
};

export default FormField;