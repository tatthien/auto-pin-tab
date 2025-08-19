import { useState, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Checkbox } from './components/ui/checkbox'
import { Label } from './components/ui/label'

interface Settings {
  autoPinTabs: boolean
}

function Options() {
  const [settings, setSettings] = useState<Settings>({
    autoPinTabs: true
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get(['settings'])
      if (result.settings) {
        setSettings(result.settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      await chrome.storage.sync.set({ settings })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const handleChange = (key: keyof Settings, value: any) => { // eslint-disable-line
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="max-w-3xl mx-auto p-5 font-sans leading-relaxed">
      <header className="text-center mb-6">
        <h1 className="text-gray-800 text-3xl font-medium m-0 mb-2">Auto Pin Tab</h1>
      </header>

      <main className="flex flex-col gap-8">
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <h2 className="text-gray-800 text-xl font-medium m-0 mb-4 pb-2 border-b border-gray-100">Tab Management</h2>
          <div className="flex items-center gap-3">
            <Checkbox id="terms" checked={settings.autoPinTabs} onCheckedChange={value => handleChange('autoPinTabs', value)} />
            <Label htmlFor="terms" className="font-normal">Enable auto-pin new tabs</Label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={saveSettings}
          >
            Save
          </Button>
          {saved && <span className="text-green-700 font-medium text-sm">Settings saved!</span>}
        </div>
      </main>
    </div>
  )
}

export default Options
