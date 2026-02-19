'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'

const schema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  linkedin_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  headline: z.string().min(1, 'Professional headline is required'),
})

type FormData = z.infer<typeof schema>

export default function Step1Page() {
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, headline, phone, linkedin_url, location')
        .single()

      if (profile) {
        reset({
          full_name: profile.full_name ?? '',
          headline: profile.headline ?? '',
          phone: profile.phone ?? '',
          linkedin_url: profile.linkedin_url ?? '',
          location: profile.location ?? '',
        })
      }
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('profiles').update({
      full_name: data.full_name,
      headline: data.headline,
      phone: data.phone || null,
      linkedin_url: data.linkedin_url || null,
      location: data.location || null,
    }).eq('user_id', user!.id)

    router.push('/onboarding/step-2')
  }

  return (
    <OnboardingStepWrapper
      title="Let's start with the basics"
      description="This information will appear on your generated documents."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="full_name"
            type="text"
            {...register('full_name')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={userEmail}
            readOnly
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            id="phone"
            type="text"
            {...register('phone')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn URL
          </label>
          <input
            id="linkedin_url"
            type="url"
            placeholder="https://linkedin.com/in/yourname"
            {...register('linkedin_url')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.linkedin_url && (
            <p className="mt-1 text-sm text-red-600">{errors.linkedin_url.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            id="location"
            type="text"
            placeholder="e.g. London, UK"
            {...register('location')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">
            Professional headline <span className="text-red-500">*</span>
          </label>
          <input
            id="headline"
            type="text"
            placeholder='e.g. "Senior Product Manager | Fintech & SaaS"'
            {...register('headline')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            A short tagline that describes your professional identity.
          </p>
          {errors.headline && (
            <p className="mt-1 text-sm text-red-600">{errors.headline.message}</p>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </OnboardingStepWrapper>
  )
}
