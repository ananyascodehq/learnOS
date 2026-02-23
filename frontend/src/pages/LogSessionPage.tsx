import SessionForm from '../components/logger/SessionForm'

export default function LogSessionPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Log a Session</h1>
                <p className="text-muted text-sm mt-1">Record what you worked on and how it went.</p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                <SessionForm />
            </div>
        </div>
    )
}
