"use client";

import * as React from "react";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

const Form = FormProvider;

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(
  null,
);

function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

const FormItemContext = React.createContext<{ id: string } | null>(null);

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={className} {...props} />
    </FormItemContext.Provider>
  );
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext || !itemContext) {
    throw new Error(
      "Form controls must be rendered inside FormField and FormItem.",
    );
  }

  const fieldState = getFieldState(fieldContext.name, formState);
  return {
    id: itemContext.id,
    name: fieldContext.name,
    formItemId: `${itemContext.id}-form-item`,
    formDescriptionId: `${itemContext.id}-form-item-description`,
    formMessageId: `${itemContext.id}-form-item-message`,
    ...fieldState,
  };
}

function FormControl({ children }: { children: React.ReactNode }) {
  const { formItemId, formMessageId, error } = useFormField();
  const describedBy = error ? formMessageId : undefined;

  if (!React.isValidElement(children)) return <>{children}</>;

  return React.cloneElement(
    children as React.ReactElement<Record<string, unknown>>,
    {
      id: formItemId,
      "aria-describedby": describedBy,
      "aria-invalid": Boolean(error),
    },
  );
}

function FormMessage({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const message = error?.message;
  const body = message ? String(message) : children;

  if (!body) return null;

  return (
    <p id={formMessageId} role="alert" className={className} {...props}>
      {body}
    </p>
  );
}

export { Form, FormControl, FormField, FormItem, FormMessage };
