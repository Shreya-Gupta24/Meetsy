import FeatureSection from '@/components/landing/FeatureSection'
import HeroSection from '@/components/landing/HeroSection'
import HowItWorks from '@/components/landing/HowItWorks'
import CTASection from '@/components/landing/CTASection'
import { PricingTable } from '@clerk/nextjs'
import React from 'react'
import PricingSection from '@/components/landing/PricingSection'
import {BackgroundGradient} from '@/components/landing/BackgroundGradient'
import MotionDiv from '@/components/ui/MotionDiv'

const page = () => {
  return (
    <div className="relative min-h-screen">
      <BackgroundGradient />
      <div className="relative z-10">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <HeroSection />
        </MotionDiv>
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <FeatureSection />
        </MotionDiv>
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <HowItWorks />
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <PricingSection />
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <CTASection />
        </MotionDiv>
      </div>
    </div>
  )
}

export default page