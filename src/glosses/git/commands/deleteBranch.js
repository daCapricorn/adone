import { clean } from 'clean-git-ref'
import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'

import { currentBranch } from './currentBranch'

/**
 * Delete a branch
 *
 * @link https://isomorphic-git.github.io/docs/deleteBranch.html
 */
export async function deleteBranch ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref
}) {
  try {
    const fs = new FileSystem(_fs)
    if (ref === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'deleteBranch',
        parameter: 'ref'
      })
    }

    if (ref !== clean(ref)) {
      throw new GitError(E.InvalidRefNameError, {
        verb: 'delete',
        noun: 'branch',
        ref,
        suggestion: clean(ref)
      })
    }

    const exist = await fs.exists(`${gitdir}/refs/heads/${ref}`)
    if (!exist) {
      throw new GitError(E.RefNotExistsError, {
        verb: 'delete',
        noun: 'branch',
        ref
      })
    }

    const currentRef = await currentBranch({ fs, gitdir })
    if (ref === currentRef) {
      throw new GitError(E.BranchDeleteError, { ref })
    }

    // Delete a specified branch
    await fs.rm(`${gitdir}/refs/heads/${ref}`)
  } catch (err) {
    err.caller = 'git.deleteBranch'
    throw err
  }
}
