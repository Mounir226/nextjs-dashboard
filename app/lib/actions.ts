'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer'
  }),
  amount: z.coerce
    .number()
    .gt(0, {message : 'Please enter an amount greater than $0.'}),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error : 'Please select an invoice status.'
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

// This is temporary until @types/react-dom is updated
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

//prevState is passed from useFormState hook, wont be used by it's required else Overload error 1 /2
export async function createInvoice(prevState : State, formData: FormData) {
  // Validate input with zod before insert to db
  // changed zod parse to safeParse that returns an {sucess, error} -> handle server
  // validation without having to put logic in try/catch block
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice',
    };
  }

  console.log('createInvoice validatedfields: ', validatedFields);

  //store monetary values in cents in db to eliminate JS floating-point errors and ensure greater accuracy.
  const { customerId, amount, status } = validatedFields.data;
  const amountInCentes = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCentes}, ${status}, ${date})
    `;
  } catch (error) {
    return {
      message: 'Database Error : Failed to create Invoice',
    };
  }
  // Revalidate the cache for the invoices page and redirect the user. runs only if try OK
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// Use zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  try {
  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    return {
      message : "Database Error : Failed to update invoice"
    }
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  
  try {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
  return { message : 'Deleted invoice'}
  } catch (error) {
    return {
      message :"Database Error : Failed to delete invoice" 
    }
  }
}
