import { download } from 'edgedriver'

const path = await download()
process.stdout.write(path)
