import Link from 'next/link';
import styles from './header.module.scss';

export default function Header() {

  return(
    <header className={styles.headerWhenPost}>
      <Link href="/">
        <img src="/logo.svg" alt="logo" />
      </Link>
    </header>
  )
}
