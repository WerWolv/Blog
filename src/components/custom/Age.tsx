export default function Age({ birthDate }: { birthDate: string }) {
  const age: number = new Date(Date.now() - new Date(birthDate).getTime()).getUTCFullYear() - 1970
  return <span>{age}</span>
}
