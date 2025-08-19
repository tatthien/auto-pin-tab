import { useState, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Checkbox } from './components/ui/checkbox'
import { Label } from './components/ui/label'
import { Input } from './components/ui/input'

interface Settings {
  autoPinTabs: boolean
  urlPatterns: string[]
}

function Options() {
  const [settings, setSettings] = useState<Settings>({
    autoPinTabs: true,
    urlPatterns: []
  })
  const [newPattern, setNewPattern] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get(['settings'])
      if (result.settings) {
        setSettings({
          autoPinTabs: result.settings.autoPinTabs ?? true,
          urlPatterns: result.settings.urlPatterns ?? []
        })
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

  const addPattern = () => {
    if (newPattern.trim()) {
      try {
        new RegExp(newPattern.trim())
        setSettings(prev => ({
          ...prev,
          urlPatterns: [...prev.urlPatterns, newPattern.trim()]
        }))
        setNewPattern('')
      } catch {
        alert('Invalid regex pattern')
      }
    }
  }

  const removePattern = (index: number) => {
    setSettings(prev => ({
      ...prev,
      urlPatterns: prev.urlPatterns.filter((_, i) => i !== index)
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

        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <h2 className="text-gray-800 text-xl font-medium m-0 mb-4 pb-2 border-b border-gray-100">URL Patterns</h2>
          <p className="text-gray-600 text-sm mb-4">
            Add regex patterns to match URLs. Only tabs with URLs matching these patterns will be pinned.
            Leave empty to pin all tabs when auto-pin is enabled.
          </p>
          
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Enter regex pattern (e.g., ^https://github\.com/.*)"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPattern()}
              className="flex-1"
            />
            <Button onClick={addPattern} variant="outline">Add</Button>
          </div>

          {settings.urlPatterns && settings.urlPatterns.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Active Patterns:</h3>
              {(settings.urlPatterns || []).map((pattern, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                  <code className="text-sm text-gray-800">{pattern}</code>
                  <Button
                    onClick={() => removePattern(index)}
                    variant="destructive"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
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
