'use client'
import { useTransition } from 'react'
import { submitHackathonProjectAction } from './actions'
import { toast } from 'react-hot-toast'
import { UploadCloud } from 'lucide-react'

export function SubmitHackathonForm({ orgId, hackathonId, teamId, hackathon }: { orgId: string, hackathonId: string, teamId: string, hackathon: any }) {
  const [isPending, startTransition] = useTransition()

  return (
    <form action={(formData) => {
      startTransition(async () => {
        const res = await submitHackathonProjectAction(orgId, hackathonId, teamId, formData)
        if (res?.error) toast.error(res.error)
        else toast.success('Project submitted successfully!')
      })
    }} className="surface-card p-6 space-y-5 border-2 border-accent/20">
      <div className="border-b pb-3">
        <h3 className="font-semibold text-lg text-accent flex items-center gap-2">
          <UploadCloud size={20} />
          Submit Project
        </h3>
        <p className="text-xs text-text-muted mt-1">Provide the links to your final project. Make sure access permissions are set to public.</p>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-text">Project Title</span>
        <input name="title" required className="w-full h-10 px-3 text-sm rounded-md border outline-none focus:border-accent bg-white" placeholder="e.g. AI Proctoring System" />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-text">Project Description</span>
        <textarea name="description" required rows={4} className="w-full p-3 text-sm rounded-md border outline-none focus:border-accent bg-white" placeholder="Explain what your project does, how you built it, and the problem it solves..."></textarea>
      </label>

      <div className="space-y-3 pt-2">
        {hackathon.require_github && (
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-text-muted">GitHub Repository URL <span className="text-rose-500">*</span></span>
            <input name="github_url" type="url" required className="w-full h-9 px-3 text-sm rounded-md border outline-none focus:border-accent" placeholder="https://github.com/..." />
          </label>
        )}
        {hackathon.require_video && (
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-text-muted">Demo Video URL <span className="text-rose-500">*</span></span>
            <input name="video_url" type="url" required className="w-full h-9 px-3 text-sm rounded-md border outline-none focus:border-accent" placeholder="https://youtube.com/..." />
          </label>
        )}
        {hackathon.require_app_link && (
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-text-muted">Live App URL <span className="text-rose-500">*</span></span>
            <input name="app_url" type="url" required className="w-full h-9 px-3 text-sm rounded-md border outline-none focus:border-accent" placeholder="https://..." />
          </label>
        )}
        {hackathon.require_drive_link && (
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-text-muted">Google Drive / Presentation URL <span className="text-rose-500">*</span></span>
            <input name="drive_url" type="url" required className="w-full h-9 px-3 text-sm rounded-md border outline-none focus:border-accent" placeholder="https://drive.google.com/..." />
          </label>
        )}
      </div>

      <button disabled={isPending} className="w-full h-11 mt-4 bg-accent hover:bg-accent-strong text-white font-bold rounded-md flex items-center justify-center gap-2 transition disabled:opacity-50">
        {isPending ? 'Submitting...' : 'Final Submit'}
      </button>
    </form>
  )
}
