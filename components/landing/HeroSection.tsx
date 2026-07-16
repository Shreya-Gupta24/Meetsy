import React from 'react'
import { SparkleIcon, RocketIcon, ZapIcon } from 'lucide-react'
import {Badge} from '../ui/badge'
import Link from 'next/link'
import MotionDiv from '../ui/MotionDiv'
import {Button} from '../ui/button'
import { HeroGradient } from './BackgroundGradient'

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
        <HeroGradient />
        <div className="relative section-container pt-10 sm:pt-14 pb-24 sm:pb-32">
            <div className="text-center">
            <Badge className="mb-6 text-sm font-medium" variant="secondary">
                Powered by AI <SparkleIcon className="size-4 inline-block ml-2" />
            </Badge>
            <h1 className="sm:text-6xl leading-[1.5] sm:!leading-[1.1] tracking-tight">
                Find Your Perfect{" "}
                <span className="block gradient-text">AI Learning Partner </span>
            </h1>
            <p className="hero-subheading mt-6">
                Join communities, set your learning goals, and get matched with
                partners who share your passion. Chat, collaborate, and grow
                together with AI-powered insights.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                >
                <Link href="/sign-up">
                    <Button
                    size="lg"
                    className="link-button hero-button-outline group"
                    >
                    <span className="hero-button-content">
                        <RocketIcon className="hero-button-icon-outline group-hover:rotate-12 group-hover:text-primary" />
                        <span className="hero-button-text">
                        Get Started for Free
                        </span>
                    </span>
                    </Button>
                </Link>
                </MotionDiv>
                <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                >
                <Link href="/#pricing">
                    <Button
                    size="lg"
                    className="link-button hero-button-primary group"
                    >
                    <span className="hero-button-content">
                        <ZapIcon className="hero-button-icon-primary group-hover:scale-125 group-hover:rotate-12" />
                        Buy a Plan
                    </span>
                    </Button>
                </Link>
                </MotionDiv>
            </div>
            </div>
        </div>
    </section>
  )
}

export default HeroSection