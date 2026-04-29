import HeroSection from '../components/home/HeroSection'
import AboutStrip from '../components/home/AboutStrip'
import VolumeSection from '../components/home/VolumeSection'
import ActivitiesBar from '../components/home/ActivitiesBar'
import EditorsPicks from '../components/home/EditorsPicks'
import FeatureSection from '../components/home/FeatureSection'
import ColumnsSection from '../components/home/ColumnsSection'
import EditorsNote from '../components/home/EditorsNote'
import SectionFolio from '../components/ui/SectionFolio'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SectionFolio numeral="I" label="The House" />
      <AboutStrip />
      <SectionFolio numeral="II" label="The Volume" />
      <VolumeSection />
      <SectionFolio numeral="III" label="Take Part" />
      <ActivitiesBar />
      <SectionFolio numeral="IV" label="Editor's Picks" />
      <EditorsPicks />
      <SectionFolio numeral="V" label="Programs" />
      <FeatureSection />
      <SectionFolio numeral="VI" label="The Columns" />
      <ColumnsSection />
      <SectionFolio numeral="VII" label="Prologue" />
      <EditorsNote />
    </>
  )
}
