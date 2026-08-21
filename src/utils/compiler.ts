export interface TestCaseExecution {
  input: string
  expected_output: string
  is_sample: boolean
  weight: number
}

export interface ExecutionResult {
  stdout: string
  stderr: string
  status: string
  passed: boolean
  time: string
  memory: number
}

// Piston language versions mapping
const PISTON_LANGUAGES: Record<string, string> = {
  python: '3.10.0',
  javascript: '18.15.0'
}

export async function runCode(
  language: string,
  sourceCode: string,
  testCase: TestCaseExecution
): Promise<ExecutionResult> {
  const langId = language.toLowerCase()
  const version = PISTON_LANGUAGES[langId] || '*'

  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language: langId,
        version: version,
        files: [
          {
            name: `main.${langId === 'python' ? 'py' : 'js'}`,
            content: sourceCode
          }
        ],
        stdin: testCase.input,
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1
      })
    })

    if (response.ok) {
      const data = await response.json()
      
      const stdout = (data.run?.stdout || '').trim()
      const stderr = (data.run?.stderr || data.compile?.stderr || '').trim()
      const passed = stdout === testCase.expected_output.trim()

      return {
        stdout,
        stderr,
        status: data.run?.code !== 0 ? 'Runtime Error' : (passed ? 'Accepted' : 'Wrong Answer'),
        passed,
        time: '0.01s', // Piston doesn't easily return raw execution time in v2 response
        memory: 1024
      }
    } else {
      console.error('Piston API Error:', response.statusText)
    }
  } catch (err) {
    console.error('Piston connection error:', err)
  }

  // Fallback if Piston goes down completely
  return {
    stdout: 'Execution failed: Could not connect to compiler API',
    stderr: '',
    status: 'API Error',
    passed: false,
    time: '0s',
    memory: 0
  }
}
