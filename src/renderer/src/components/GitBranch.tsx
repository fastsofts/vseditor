import gitBranchSVG from '../assets/editoricons/git-branch.svg'
import gitBranchSVGHighlight from '../assets/editoricons/git-branchhighlight.svg'


interface Props{
  hover: number;
  onMouseOver: () => void;
  onMouseOut: () => void;
  class: string;
}

function GitBranch(props: Props): JSX.Element {
  return props.hover === 1 ? (
    <img className={props.class} src={gitBranchSVG} alt="Git" />
  ) : (
    <img className={props.class} src={gitBranchSVGHighlight} alt="Git" />
  )
}

export default GitBranch
