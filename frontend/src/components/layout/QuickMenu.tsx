"use client"

import Image from "next/image"
import Link from "next/link"

const quickMenus = [
  {
    label: "로그인",
    href: "/login",
    icon: "/icons/quick-menu/login.svg",
  },
  {
    label: "문의하기",
    href: "#contact",
    icon: "/icons/quick-menu/contact.svg",
  },
] as const

const buttonClassName = `
  group
  flex h-[76px] w-[76px]
  cursor-pointer items-center justify-center
  rounded-[24px]
  border border-brand-border
  bg-white
  shadow-[0_12px_28px_rgba(50,94,160,0.12)]
  transition-all duration-300 ease-out

  hover:-translate-y-1
  hover:border-transparent
  hover:bg-gradient-to-br
  hover:from-brand-primary-deep
  hover:to-brand-primary-light
  hover:shadow-[0_16px_32px_rgba(36,107,254,0.28)]

  active:translate-y-0
  active:scale-95
  active:border-transparent
  active:bg-gradient-to-br
  active:from-brand-primary-deep
  active:to-brand-primary-light

  focus-visible:border-transparent
  focus-visible:bg-gradient-to-br
  focus-visible:from-brand-primary-deep
  focus-visible:to-brand-primary-light
  focus-visible:outline-none
  focus-visible:ring-4
  focus-visible:ring-brand-primary/25

  motion-reduce:transform-none
  motion-reduce:transition-none

  xl:h-[84px]
  xl:w-[84px]
`

const iconClassName = `
  h-[34px] w-[34px]
  object-contain
  transition-[filter] duration-300 ease-out

  group-hover:brightness-0
  group-hover:invert

  group-active:brightness-0
  group-active:invert

  group-focus-visible:brightness-0
  group-focus-visible:invert

  motion-reduce:transition-none

  xl:h-[38px]
  xl:w-[38px]
`

export default function QuickMenu() {
  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <aside
      aria-label="빠른 메뉴"
      className="fixed right-5 top-4/5 z-40 hidden -translate-y-1/2 flex-col items-center lg:flex xl:right-8"
    >
      <div className="flex flex-col gap-4">
        {quickMenus.map((menu) => (
          <Link
            key={menu.label}
            href={menu.href}
            aria-label={menu.label}
            className={buttonClassName}
          >
            <Image
              src={menu.icon}
              alt=""
              width={38}
              height={38}
              aria-hidden="true"
              className={iconClassName}
            />
          </Link>
        ))}

        <button
          type="button"
          aria-label="페이지 맨 위로 이동"
          onClick={handleScrollTop}
          className={buttonClassName}
        >
          <Image
            src="/icons/quick-menu/top.svg"
            alt=""
            width={38}
            height={38}
            aria-hidden="true"
            className={iconClassName}
          />
        </button>
      </div>
    </aside>
  )
}
